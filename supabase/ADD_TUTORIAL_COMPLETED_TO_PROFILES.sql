-- ============================================
-- ADD: tutorial_completed flag to profiles
-- Tracks whether the swipe tutorial was shown/completed
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean DEFAULT false;
