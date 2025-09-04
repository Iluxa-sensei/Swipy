-- Check startups data
-- Run this in Supabase Dashboard -> SQL Editor

-- Check if startups table exists and has data
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'startups';

-- Check startups table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'startups' 
ORDER BY ordinal_position;

-- Check if there are any startups in the table
SELECT COUNT(*) as total_startups FROM public.startups;

-- Check first few startups
SELECT * FROM public.startups LIMIT 5;

-- Check if there are any profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check first few profiles
SELECT * FROM public.profiles LIMIT 5;

-- Check RLS policies for startups
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'startups';
