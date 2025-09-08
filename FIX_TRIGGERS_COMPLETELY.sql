-- Complete fix for trigger issues
-- This script completely fixes all trigger functions to prevent "user_id" errors

-- Drop and recreate the startup like trigger function
DROP FUNCTION IF EXISTS public.handle_startup_like() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_startup_like()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if the startup still exists
  IF EXISTS (SELECT 1 FROM public.startups WHERE id = NEW.startup_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, data)
    SELECT 
      s.owner_id,
      'New Like!',
      'Someone liked your startup "' || s.name || '"',
      'like',
      jsonb_build_object('startup_id', s.id, 'startup_name', s.name, 'liker_id', NEW.user_id)
    FROM public.startups s
    WHERE s.id = NEW.startup_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the mutual match trigger function
DROP FUNCTION IF EXISTS public.handle_mutual_match() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_mutual_match()
RETURNS trigger AS $$
DECLARE
  startup_owner_id uuid;
BEGIN
  -- Only proceed if the startup still exists
  IF NOT EXISTS (SELECT 1 FROM public.startups WHERE id = NEW.startup_id) THEN
    RETURN NEW;
  END IF;
  
  -- Get startup owner
  SELECT owner_id INTO startup_owner_id FROM public.startups WHERE id = NEW.startup_id;
  
  -- Check if startup owner also liked the liker's startup
  IF EXISTS (
    SELECT 1 FROM public.likes l
    JOIN public.startups s ON l.startup_id = s.id
    WHERE l.user_id = startup_owner_id AND s.owner_id = NEW.user_id
  ) THEN
    -- It's a match! Notify both users
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES 
      (NEW.user_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match', 
       jsonb_build_object('startup_id', NEW.startup_id, 'matched_user_id', startup_owner_id)),
      (startup_owner_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match',
       jsonb_build_object('startup_id', NEW.startup_id, 'matched_user_id', NEW.user_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_startup_like ON public.likes;
CREATE TRIGGER on_startup_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_startup_like();

DROP TRIGGER IF EXISTS on_mutual_match ON public.likes;
CREATE TRIGGER on_mutual_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_mutual_match();

-- Success message
SELECT 'TRIGGERS COMPLETELY FIXED!' as status,
       'All trigger functions recreated to prevent user_id errors.' as description;
