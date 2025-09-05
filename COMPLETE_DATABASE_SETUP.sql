-- Complete Database Setup for Swipy
-- Run this script in Supabase Dashboard -> SQL Editor
-- This script safely handles existing objects and sets up everything properly

-- ==============================================
-- 1. ENABLE EXTENSIONS
-- ==============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 2. CREATE TABLES (with IF NOT EXISTS)
-- ==============================================

-- Profiles table (1-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text,
  avatar_url text,
  bio text,
  location text,
  website text,
  role text,
  interests text[],
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Startups table
CREATE TABLE IF NOT EXISTS public.startups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  website text,
  logo_url text,
  industry text,
  stage text,
  funding_round text,
  team_size text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Likes (user likes startup)
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

-- Passes (user passes startup)
CREATE TABLE IF NOT EXISTS public.passes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, startup_id)
);

-- Chats
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now()
);

-- Chat participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY(chat_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'like', 'match', 'message', 'system'
  read boolean DEFAULT false,
  data jsonb, -- Additional data for the notification
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- 3. ADD MISSING COLUMNS (if they don't exist)
-- ==============================================
DO $$ 
BEGIN
  -- Add missing columns to profiles table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
    ALTER TABLE public.profiles ADD COLUMN interests TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. DROP EXISTING POLICIES (to avoid conflicts)
-- ==============================================

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by users themselves" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Drop existing policies for startups
DROP POLICY IF EXISTS "Startups are readable by authenticated" ON public.startups;
DROP POLICY IF EXISTS "Owners can insert startups" ON public.startups;
DROP POLICY IF EXISTS "Owners can update their startups" ON public.startups;
DROP POLICY IF EXISTS "Owners can delete their startups" ON public.startups;

-- Drop existing policies for likes and passes
DROP POLICY IF EXISTS "Users can manage their likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their passes" ON public.passes;

-- Drop existing policies for chats
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

-- Drop existing policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ==============================================
-- 6. CREATE RLS POLICIES
-- ==============================================

-- Policies: profiles
CREATE POLICY "Profiles are viewable by users themselves" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Also allow users to view profiles of other users (for networking)
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies: startups
CREATE POLICY "Startups are readable by authenticated" ON public.startups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can insert startups" ON public.startups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their startups" ON public.startups
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their startups" ON public.startups
  FOR DELETE USING (auth.uid() = owner_id);

-- Policies: likes and passes (user-owned)
CREATE POLICY "Users can manage their likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their passes" ON public.passes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: chats
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = id AND cp.user_id = auth.uid()
    )
  );

-- Participants policy
CREATE POLICY "Users can view chat participants of their chats" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid()
    )
  );

-- Messages policy
CREATE POLICY "Users can read messages in their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid()
    )
  );

-- Notifications policy
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- 7. CREATE FUNCTIONS
-- ==============================================

-- Function to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert basic profile with all required fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    username,
    bio,
    location,
    website,
    role,
    interests,
    onboarding_completed
  ) VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    false
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle startup like notifications
CREATE OR REPLACE FUNCTION public.handle_startup_like()
RETURNS trigger AS $$
BEGIN
  -- Only notify if it's a new like
  IF (tg_op = 'INSERT') THEN
    INSERT INTO public.notifications (user_id, title, message, type, data)
    SELECT 
      s.owner_id,
      'New Like!',
      'Someone liked your startup "' || s.name || '"',
      'like',
      jsonb_build_object('startup_id', s.id, 'startup_name', s.name, 'liker_id', new.user_id)
    FROM public.startups s
    WHERE s.id = new.startup_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle mutual matches
CREATE OR REPLACE FUNCTION public.handle_mutual_match()
RETURNS trigger AS $$
DECLARE
  startup_owner_id uuid;
BEGIN
  -- Get startup owner
  SELECT owner_id INTO startup_owner_id FROM public.startups WHERE id = new.startup_id;
  
  -- Check if startup owner also liked the liker's startup
  IF EXISTS (
    SELECT 1 FROM public.likes l
    JOIN public.startups s ON l.startup_id = s.id
    WHERE l.user_id = startup_owner_id AND s.owner_id = new.user_id
  ) THEN
    -- It's a match! Notify both users
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES 
      (new.user_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match', 
       jsonb_build_object('startup_id', new.startup_id, 'matched_user_id', startup_owner_id)),
      (startup_owner_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match',
       jsonb_build_object('startup_id', new.startup_id, 'matched_user_id', new.user_id));
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 8. CREATE TRIGGERS
-- ==============================================

-- Triggers to maintain updated_at
DROP TRIGGER IF EXISTS startups_set_updated_at ON public.startups;
CREATE TRIGGER startups_set_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for startup likes
DROP TRIGGER IF EXISTS on_startup_like ON public.likes;
CREATE TRIGGER on_startup_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_startup_like();

-- Trigger for mutual matches
DROP TRIGGER IF EXISTS on_mutual_match ON public.likes;
CREATE TRIGGER on_mutual_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_match();

-- ==============================================
-- 9. CREATE INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_startups_owner_id ON public.startups(owner_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_startup_id ON public.likes(startup_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON public.passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_startup_id ON public.passes(startup_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ==============================================
-- 10. VERIFICATION QUERIES
-- ==============================================

-- Check table structure
SELECT 'PROFILES TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check policies
SELECT 'PROFILES POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'STARTUPS POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'startups';

-- Check if there are any existing profiles
SELECT 'EXISTING PROFILES:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check if there are any existing startups
SELECT 'EXISTING STARTUPS:' as info;
SELECT COUNT(*) as total_startups FROM public.startups;

-- Success message
SELECT 'DATABASE SETUP COMPLETED SUCCESSFULLY!' as status;
