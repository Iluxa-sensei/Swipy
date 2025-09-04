-- Fix profile creation trigger
-- Run this in Supabase Dashboard -> SQL Editor

-- Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

-- Drop and recreate the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert basic profile with only required fields
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger function
SELECT * FROM public.profiles LIMIT 1;
