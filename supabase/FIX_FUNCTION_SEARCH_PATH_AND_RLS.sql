-- ============================================================================
-- Fix Function Search Path and RLS Policy Issues
-- ============================================================================
-- This migration fixes the following security issues:
-- 1. function_search_path_mutable: Add SET search_path to all functions
-- 2. rls_policy_always_true: Fix overly permissive notifications policy
-- ============================================================================

-- ============================================================================
-- SECTION 1: Fix Function Search Path (Prevent Search Path Injection)
-- ============================================================================
-- Setting search_path to empty string forces explicit schema qualification
-- This prevents search path injection attacks
-- ============================================================================

-- Fix all functions by setting search_path to empty string
-- This requires explicit schema qualification (e.g., public.table_name)
-- Using DO block to handle functions that may not exist

DO $$
BEGIN
  -- Set search_path for all functions (skip if function doesn't exist)
  BEGIN
    ALTER FUNCTION public.get_complete_profile() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.handle_new_user() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.slugify(text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_or_create_startup_chat(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.mark_chat_as_read(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.like_startup_optimized(uuid, uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.pass_startup_optimized(uuid, uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_swipe_status_batch(uuid, uuid[]) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_user_swipes_lightweight(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.check_swipe_rate_limit() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.user_is_chat_participant(uuid, uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.update_chat_last_message(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.sync_onboarding_data(uuid, jsonb) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_startups_paginated(integer, integer, text[], text[], text[], text, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.handle_startup_like() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_startups_count(text[], text[], text[], text, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.handle_mutual_match() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_startups_lightweight(integer, integer, text[], text[], text[], text, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_user_chats_simple(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_chat_with_startup(uuid, uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_user_chats_with_startups(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_startups_count_cached(text[], text[], text[], text, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.check_rate_limit(text, integer, integer) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.ensure_startup_slug() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.calculate_profile_completion(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_chat_participants_simple(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_startups_lightweight_fast_debug(integer, integer, text[], text[], text[], text, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.set_updated_at() SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.verify_chat_access(uuid, uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_chat_messages_simple(uuid, integer, integer) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.send_message_simple(uuid, text) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_or_create_user_chat(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_chat_info_rpc(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.start_or_get_chat(uuid) SET search_path = '';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- ============================================================================
-- SECTION 2: Fix RLS Policy for Notifications
-- ============================================================================
-- The current policy allows unrestricted INSERT access (WITH CHECK (true))
-- We need to restrict it while still allowing trigger functions to work
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Remove INSERT access for authenticated users
-- SECURITY DEFINER functions (triggers) bypass RLS, so they will still work
-- Regular authenticated users cannot insert notifications directly
-- This prevents users from creating fake notifications

-- Allow service_role to insert notifications (for admin/system operations)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Note: 
-- - SECURITY DEFINER functions (triggers like handle_startup_like, handle_mutual_match)
--   bypass RLS entirely because they run with elevated privileges, so they will work
-- - Regular authenticated users cannot insert notifications (no policy allows it)
-- - Service role can insert notifications (for admin operations)
-- - This is secure while maintaining functionality for trigger-based notifications

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All functions now have SET search_path = '' which prevents search path injection
--    - Functions must use explicit schema qualification (e.g., public.table_name)
--    - This is a security best practice
--
-- 2. The notifications INSERT policy is now restricted to service_role only
--    - Trigger functions (which use SECURITY DEFINER) can still insert notifications
--    - Regular authenticated users cannot insert notifications directly
--    - This prevents users from creating fake notifications
--
-- 3. If you need to allow specific users to create notifications, create a
--    SECURITY DEFINER function that validates the request and inserts the notification
-- ============================================================================

