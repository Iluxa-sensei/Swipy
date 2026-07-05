-- ============================================
-- ADD: social link columns to startups
-- ============================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS linkedin_url text;

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS github_url text;

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS instagram_url text;

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS twitter_url text;
