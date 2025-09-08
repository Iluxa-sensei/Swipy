-- Safe version: Fix delete issues and clean up template data
-- This script fixes the delete startup functionality and removes template data safely

-- Remove all template/example startups (this will cascade to related data)
DELETE FROM public.startups WHERE name IN (
  'TechStartup Inc.',
  'InnovateCorp',
  'FutureTech Solutions',
  'StartupXYZ',
  'Example Startup',
  'Demo Company',
  'Test Startup',
  'Sample Corp',
  'Template Startup',
  'Sample Company'
);

-- Clean up any orphaned notifications
DELETE FROM public.notifications 
WHERE data->>'startup_id' NOT IN (
  SELECT id::text FROM public.startups
);

-- Clean up any orphaned likes (should be handled by cascade, but just in case)
DELETE FROM public.likes 
WHERE startup_id NOT IN (SELECT id FROM public.startups);

-- Clean up any orphaned passes (should be handled by cascade, but just in case)
DELETE FROM public.passes 
WHERE startup_id NOT IN (SELECT id FROM public.startups);

-- Fix the trigger functions to handle edge cases better
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

-- Fix the mutual match function
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

-- Ensure cascade delete is properly set up
-- Check if constraints exist and update them if needed
DO $$
BEGIN
  -- Update likes constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_startup_id_fkey' 
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE public.likes DROP CONSTRAINT likes_startup_id_fkey;
    ALTER TABLE public.likes ADD CONSTRAINT likes_startup_id_fkey 
      FOREIGN KEY (startup_id) REFERENCES public.startups(id) ON DELETE CASCADE;
  END IF;

  -- Update passes constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'passes_startup_id_fkey' 
    AND table_name = 'passes'
  ) THEN
    ALTER TABLE public.passes DROP CONSTRAINT passes_startup_id_fkey;
    ALTER TABLE public.passes ADD CONSTRAINT passes_startup_id_fkey 
      FOREIGN KEY (startup_id) REFERENCES public.startups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Success message
SELECT 'DELETE ISSUES FIXED AND TEMPLATE DATA CLEANED SAFELY!' as status,
       'All template startups removed and delete functionality fixed without touching system triggers.' as description;
