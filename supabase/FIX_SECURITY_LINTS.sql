-- ============================================================================
-- Fix Security Issues Detected by Supabase Linter
-- ============================================================================
-- This migration fixes the following security issues:
-- 1. security_definer_view: Remove SECURITY DEFINER from complete_profiles view
-- 2. rls_disabled_in_public: Enable RLS on swipe_rate_limits table
-- 3. rls_disabled_in_public: Enable RLS on api_rate_limits table
-- ============================================================================

-- ============================================================================
-- SECTION 1: Fix SECURITY DEFINER View Issue
-- ============================================================================

-- Drop the existing view if it exists with SECURITY DEFINER
DROP VIEW IF EXISTS public.complete_profiles CASCADE;

-- Recreate the view without SECURITY DEFINER
-- Note: This view should use RLS policies from underlying tables instead
CREATE OR REPLACE VIEW public.complete_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.bio,
  p.location,
  p.website,
  p.role,
  p.interests,
  p.onboarding_completed,
  p.created_at,
  p.updated_at,
  -- Add any additional computed fields here
  COALESCE(p.full_name, '') as display_name
FROM public.profiles p;

-- Grant access to authenticated users
GRANT SELECT ON public.complete_profiles TO authenticated;

-- Add RLS policy for the view (views inherit RLS from underlying tables, but we can add explicit policy)
-- Since the view queries public.profiles, it will use the RLS policies from that table
-- No additional policy needed if the underlying table has proper RLS

-- ============================================================================
-- SECTION 2: Enable RLS on swipe_rate_limits table
-- ============================================================================

-- Enable RLS on swipe_rate_limits table
ALTER TABLE IF EXISTS public.swipe_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own swipe rate limits" ON public.swipe_rate_limits;
DROP POLICY IF EXISTS "Users can insert their own swipe rate limits" ON public.swipe_rate_limits;
DROP POLICY IF EXISTS "Users can update their own swipe rate limits" ON public.swipe_rate_limits;
DROP POLICY IF EXISTS "System can manage swipe rate limits" ON public.swipe_rate_limits;
DROP POLICY IF EXISTS "Deny all public access to swipe rate limits" ON public.swipe_rate_limits;

-- Rate limit tables are system tables and should not be directly accessed by users
-- They should only be accessed through SECURITY DEFINER functions
-- Policy: Deny all access to authenticated users (they should use RPC functions instead)
CREATE POLICY "Deny all public access to swipe rate limits"
ON public.swipe_rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy: Allow system/service role to manage all rate limits (for rate limiting functions)
-- This is needed for rate limiting functions that need to check/update limits
CREATE POLICY "System can manage swipe rate limits"
ON public.swipe_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SECTION 3: Enable RLS on api_rate_limits table
-- ============================================================================

-- Enable RLS on api_rate_limits table
ALTER TABLE IF EXISTS public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own API rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Users can insert their own API rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Users can update their own API rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "System can manage API rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Deny all public access to API rate limits" ON public.api_rate_limits;

-- Rate limit tables are system tables and should not be directly accessed by users
-- They should only be accessed through SECURITY DEFINER functions
-- Policy: Deny all access to authenticated users (they should use RPC functions instead)
CREATE POLICY "Deny all public access to API rate limits"
ON public.api_rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy: Allow system/service role to manage all rate limits (for rate limiting functions)
-- This is needed for rate limiting functions that need to check/update limits
CREATE POLICY "System can manage API rate limits"
ON public.api_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The complete_profiles view is recreated without SECURITY DEFINER
--    - It now relies on RLS policies from the underlying profiles table
--    - This is more secure as it respects user permissions
--
-- 2. Both rate limit tables now have RLS enabled with appropriate policies:
--    - All access is denied to authenticated users (they should use RPC functions)
--    - Service role can manage all records (needed for rate limiting functions)
--    - This is more secure as rate limit tables are system tables
--
-- 3. Rate limiting functions (like check_swipe_rate_limit) should use 
--    SECURITY DEFINER to bypass RLS when needed to check/update limits
-- ============================================================================

