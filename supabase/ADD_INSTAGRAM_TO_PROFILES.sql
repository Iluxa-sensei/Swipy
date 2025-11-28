-- ============================================
-- ADD instagram_url COLUMN TO profiles TABLE
-- ============================================
-- This adds the instagram_url field to profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram_url text;

