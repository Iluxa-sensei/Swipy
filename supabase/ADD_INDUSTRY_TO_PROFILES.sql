-- ============================================
-- ADD industry COLUMN TO profiles TABLE
-- ============================================
-- This adds the industry field to profiles table
-- to match the fields available in OnboardingPage

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS industry text;

