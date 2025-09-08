-- Fix Chat System to Connect with Startups
-- This script adds startup context to chats and improves the chat system

-- Add startup_id to chats table to link chats with specific startups
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_chats_startup_id ON public.chats(startup_id);

-- Add chat title/name for better identification
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT now();

-- Add index for sorting chats by last message
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON public.chats(last_message_at DESC);

-- Update RLS policies to include startup context
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = id AND cp.user_id = auth.uid()
    )
  );

-- Add policy for creating chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_id AND s.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.likes l
      WHERE l.startup_id = startup_id AND l.user_id = auth.uid()
    )
  );

-- Function to automatically update last_message_at when a message is sent
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_message_at
DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_last_message();

-- Function to create or get chat between users for a specific startup
CREATE OR REPLACE FUNCTION public.get_or_create_startup_chat(
  p_startup_id uuid,
  p_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_chat_id uuid;
  v_startup_owner_id uuid;
BEGIN
  -- Get startup owner
  SELECT owner_id INTO v_startup_owner_id 
  FROM public.startups 
  WHERE id = p_startup_id;
  
  IF v_startup_owner_id IS NULL THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;
  
  -- Check if chat already exists
  SELECT c.id INTO v_chat_id
  FROM public.chats c
  JOIN public.chat_participants cp1 ON c.id = cp1.chat_id
  JOIN public.chat_participants cp2 ON c.id = cp2.chat_id
  WHERE c.startup_id = p_startup_id
    AND cp1.user_id = p_user_id
    AND cp2.user_id = v_startup_owner_id;
  
  -- If chat exists, return it
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;
  
  -- Create new chat
  INSERT INTO public.chats (startup_id, title)
  VALUES (p_startup_id, (SELECT name FROM public.startups WHERE id = p_startup_id))
  RETURNING id INTO v_chat_id;
  
  -- Add participants
  INSERT INTO public.chat_participants (chat_id, user_id)
  VALUES (v_chat_id, p_user_id), (v_chat_id, v_startup_owner_id);
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chat info with startup details
CREATE OR REPLACE FUNCTION public.get_chat_with_startup(p_chat_id uuid)
RETURNS TABLE (
  chat_id uuid,
  startup_id uuid,
  startup_name text,
  startup_logo text,
  startup_gradient text,
  title text,
  last_message_at timestamp with time zone,
  participants jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chat_id,
    c.startup_id,
    s.name as startup_name,
    s.logo_url as startup_logo,
    s.gradient as startup_gradient,
    c.title,
    c.last_message_at,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
    ) as participants
  FROM public.chats c
  JOIN public.startups s ON c.startup_id = s.id
  JOIN public.chat_participants cp ON c.id = cp.chat_id
  JOIN public.profiles p ON cp.user_id = p.id
  WHERE c.id = p_chat_id
  GROUP BY c.id, c.startup_id, s.name, s.logo_url, s.gradient, c.title, c.last_message_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's chats with startup info
CREATE OR REPLACE FUNCTION public.get_user_chats_with_startups(p_user_id uuid)
RETURNS TABLE (
  chat_id uuid,
  startup_id uuid,
  startup_name text,
  startup_logo text,
  startup_gradient text,
  title text,
  last_message_at timestamp with time zone,
  last_message_body text,
  last_message_sender_id uuid,
  unread_count bigint,
  other_participant jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chat_id,
    c.startup_id,
    s.name as startup_name,
    s.logo_url as startup_logo,
    s.gradient as startup_gradient,
    c.title,
    c.last_message_at,
    m.body as last_message_body,
    m.sender_id as last_message_sender_id,
    COALESCE(unread.unread_count, 0) as unread_count,
    jsonb_build_object(
      'id', other_p.id,
      'full_name', other_p.full_name,
      'avatar_url', other_p.avatar_url
    ) as other_participant
  FROM public.chats c
  JOIN public.startups s ON c.startup_id = s.id
  JOIN public.chat_participants cp ON c.id = cp.chat_id
  JOIN public.chat_participants other_cp ON c.id = other_cp.chat_id
  JOIN public.profiles other_p ON other_cp.user_id = other_p.id
  LEFT JOIN LATERAL (
    SELECT body, sender_id
    FROM public.messages
    WHERE chat_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM public.messages
    WHERE chat_id = c.id 
      AND sender_id != p_user_id
      AND created_at > COALESCE(
        (SELECT last_read_at FROM public.chat_participants 
         WHERE chat_id = c.id AND user_id = p_user_id), 
        '1970-01-01'::timestamp
      )
  ) unread ON true
  WHERE cp.user_id = p_user_id
    AND other_cp.user_id != p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add last_read_at to chat_participants for unread message tracking
ALTER TABLE public.chat_participants 
ADD COLUMN IF NOT EXISTS last_read_at timestamp with time zone DEFAULT now();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_chat_as_read(p_chat_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.chat_participants 
  SET last_read_at = now()
  WHERE chat_id = p_chat_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some sample data for testing
INSERT INTO public.chats (startup_id, title) 
SELECT id, name FROM public.startups LIMIT 3
ON CONFLICT DO NOTHING;

-- Add sample participants to chats (if they don't exist)
INSERT INTO public.chat_participants (chat_id, user_id)
SELECT 
  c.id,
  CASE 
    WHEN c.startup_id = s.id THEN s.owner_id
    ELSE (SELECT id FROM auth.users LIMIT 1)
  END
FROM public.chats c
JOIN public.startups s ON c.startup_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_participants cp 
  WHERE cp.chat_id = c.id AND cp.user_id = s.owner_id
)
ON CONFLICT DO NOTHING;

-- Add sample messages
INSERT INTO public.messages (chat_id, sender_id, body)
SELECT 
  c.id,
  cp.user_id,
  CASE 
    WHEN cp.user_id = s.owner_id THEN 'Hi! Thanks for your interest in ' || s.name || '. I''d love to discuss potential collaboration!'
    ELSE 'Hello! I''m interested in learning more about ' || s.name || '. Could we schedule a call?'
  END
FROM public.chats c
JOIN public.startups s ON c.startup_id = s.id
JOIN public.chat_participants cp ON c.id = cp.chat_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.messages m WHERE m.chat_id = c.id
)
LIMIT 6;

-- Update last_message_at for existing chats
UPDATE public.chats 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM public.messages 
  WHERE chat_id = public.chats.id
)
WHERE last_message_at IS NULL;

COMMENT ON TABLE public.chats IS 'Chats linked to specific startups for investor-founder communication';
COMMENT ON COLUMN public.chats.startup_id IS 'The startup this chat is about';
COMMENT ON COLUMN public.chats.title IS 'Chat title, usually the startup name';
COMMENT ON COLUMN public.chats.last_message_at IS 'Timestamp of the last message for sorting';
COMMENT ON COLUMN public.chat_participants.last_read_at IS 'When the user last read messages in this chat';
