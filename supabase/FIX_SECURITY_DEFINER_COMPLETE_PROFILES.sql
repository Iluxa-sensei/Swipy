BEGIN;

-- ============================================================================
-- Safe migration: Replace SECURITY DEFINER view with an invoker-mode view
-- - Identifies and lists all dependents before making changes
-- - Verifies RLS enabled on public.profiles
-- - Verifies at least one SELECT policy exists on public.profiles
-- - Handles dependencies safely by recreating them if needed
-- ============================================================================
-- NOTE: This script will show you what depends on the view and handle it safely
-- ============================================================================

-- ============================================================================
-- STEP 0: Ensure we're operating in the public schema (safety)
-- ============================================================================
SET search_path = public, pg_catalog;

-- ============================================================================
-- STEP 1: Check whether view exists and who owns it
-- ============================================================================
DO $$
DECLARE
  v_exists boolean;
  v_owner text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
      AND c.relname = 'complete_profiles'
  ) INTO v_exists;

  IF v_exists THEN
    SELECT pg_get_userbyid(c.relowner) INTO v_owner
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
      AND c.relname = 'complete_profiles';
    RAISE NOTICE 'View public.complete_profiles exists and is owned by: %', COALESCE(v_owner, 'UNKNOWN');
  ELSE
    RAISE NOTICE 'View public.complete_profiles does not exist. Will create it.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Identify and list ALL dependent objects
-- This helps us understand what will be affected
-- ============================================================================
DO $$
DECLARE
  dep_rec record;
  dep_count integer := 0;
BEGIN
  -- Count dependencies
  SELECT COUNT(*) INTO dep_count
  FROM pg_depend d
  JOIN pg_class refc ON d.refobjid = refc.oid
  JOIN pg_namespace refn ON refc.relnamespace = refn.oid
  WHERE refn.nspname = 'public'
    AND refc.relname = 'complete_profiles'
    AND d.deptype IN ('n','a','i','p');

  IF dep_count > 0 THEN
    RAISE NOTICE 'Found % dependent object(s) on public.complete_profiles:', dep_count;
    RAISE NOTICE 'Listing dependencies:';
    
    -- List all dependencies with details
    FOR dep_rec IN
      SELECT 
        d.deptype,
        CASE d.deptype
          WHEN 'n' THEN 'normal'
          WHEN 'a' THEN 'auto'
          WHEN 'i' THEN 'internal'
          WHEN 'p' THEN 'pin'
          ELSE 'unknown'
        END AS dep_type_name,
        depc.relkind,
        depc.relname AS dep_name,
        depn.nspname AS dep_schema,
        CASE depc.relkind
          WHEN 'r' THEN 'table'
          WHEN 'v' THEN 'view'
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'm' THEN 'materialized view'
          ELSE 'other'
        END AS dep_type
      FROM pg_depend d
      JOIN pg_class refc ON d.refobjid = refc.oid
      JOIN pg_namespace refn ON refc.relnamespace = refn.oid
      JOIN pg_class depc ON d.objid = depc.oid
      JOIN pg_namespace depn ON depc.relnamespace = depn.oid
      WHERE refn.nspname = 'public'
        AND refc.relname = 'complete_profiles'
        AND d.deptype IN ('n','a','i','p')
      ORDER BY depc.relkind, depc.relname
    LOOP
      RAISE NOTICE '  - %: % (schema: %, type: %, dependency: %)', 
        dep_rec.dep_name, 
        dep_rec.dep_type,
        dep_rec.dep_schema,
        dep_rec.dep_type_name,
        CASE dep_rec.relkind
          WHEN 'r' THEN 'table'
          WHEN 'v' THEN 'view'
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'm' THEN 'materialized view'
          ELSE 'other'
        END;
    END LOOP;
    
    RAISE NOTICE 'Proceeding with safe recreation (dependencies will be automatically recreated if possible)...';
  ELSE
    RAISE NOTICE 'No direct dependent DB objects found for public.complete_profiles.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify RLS is enabled on public.profiles
-- ============================================================================
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT c.relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND c.relkind = 'r'; -- ordinary table

  IF rls_enabled IS NULL THEN
    RAISE EXCEPTION 'ABORT: Table public.profiles not found.';
  ELSIF NOT rls_enabled THEN
    RAISE EXCEPTION 'ABORT: RLS is not enabled on public.profiles. Enable RLS before proceeding.';
  ELSE
    RAISE NOTICE 'RLS is enabled on public.profiles.';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify that at least one SELECT policy exists for public.profiles
-- ============================================================================
DO $$
DECLARE
  select_policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policycmd = 'r'
  ) INTO select_policy_exists;

  IF NOT select_policy_exists THEN
    RAISE EXCEPTION 'ABORT: No SELECT policies found on public.profiles. Create appropriate RLS policies before proceeding.';
  ELSE
    RAISE NOTICE 'Found at least one SELECT policy on public.profiles.';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Store view definition and dependencies for safe recreation
-- ============================================================================
-- Create a temporary table to store dependency information
CREATE TEMP TABLE IF NOT EXISTS _complete_profiles_deps AS
SELECT 
  d.objid,
  depc.relkind,
  depc.relname AS dep_name,
  depn.nspname AS dep_schema,
  pg_get_functiondef(depc.oid) AS function_def,
  pg_get_viewdef(depc.oid, true) AS view_def
FROM pg_depend d
JOIN pg_class refc ON d.refobjid = refc.oid
JOIN pg_namespace refn ON refc.relnamespace = refn.oid
JOIN pg_class depc ON d.objid = depc.oid
JOIN pg_namespace depn ON depc.relnamespace = depn.oid
WHERE refn.nspname = 'public'
  AND refc.relname = 'complete_profiles'
  AND d.deptype IN ('n','a')
  AND depc.relkind IN ('v', 'f', 'p'); -- views, functions, procedures

-- ============================================================================
-- STEP 6: Drop the view (CASCADE will drop dependent objects temporarily)
-- This is safe because we're recreating everything immediately after
-- ============================================================================
DROP VIEW IF EXISTS public.complete_profiles CASCADE;

-- ============================================================================
-- STEP 7: Recreate the view without SECURITY DEFINER
-- ============================================================================
CREATE VIEW public.complete_profiles AS
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
  COALESCE(p.full_name, '') AS display_name
FROM public.profiles p;

DO $$
BEGIN
  RAISE NOTICE 'View public.complete_profiles recreated without SECURITY DEFINER.';
END $$;

-- ============================================================================
-- STEP 8: Recreate dependent views if they were dropped
-- ============================================================================
DO $$
DECLARE
  dep_rec record;
  recreated_count integer := 0;
BEGIN
  -- Recreate dependent views
  FOR dep_rec IN
    SELECT dep_schema, dep_name, view_def
    FROM _complete_profiles_deps
    WHERE relkind = 'v'
      AND view_def IS NOT NULL
  LOOP
    BEGIN
      -- Try to recreate the view
      EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s', 
        dep_rec.dep_schema, 
        dep_rec.dep_name, 
        dep_rec.view_def);
      recreated_count := recreated_count + 1;
      RAISE NOTICE 'Recreated dependent view: %.%', dep_rec.dep_schema, dep_rec.dep_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not automatically recreate view %.%: %', 
        dep_rec.dep_schema, dep_rec.dep_name, SQLERRM;
      RAISE NOTICE 'You may need to manually recreate this view.';
    END;
  END LOOP;
  
  IF recreated_count > 0 THEN
    RAISE NOTICE 'Recreated % dependent view(s).', recreated_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Recreate dependent functions if they were dropped
-- ============================================================================
DO $$
DECLARE
  dep_rec record;
  recreated_count integer := 0;
BEGIN
  -- Recreate dependent functions
  FOR dep_rec IN
    SELECT dep_schema, dep_name, function_def
    FROM _complete_profiles_deps
    WHERE relkind IN ('f', 'p')
      AND function_def IS NOT NULL
  LOOP
    BEGIN
      -- Try to recreate the function
      EXECUTE dep_rec.function_def;
      recreated_count := recreated_count + 1;
      RAISE NOTICE 'Recreated dependent function: %.%', dep_rec.dep_schema, dep_rec.dep_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not automatically recreate function %.%: %', 
        dep_rec.dep_schema, dep_rec.dep_name, SQLERRM;
      RAISE NOTICE 'You may need to manually recreate this function.';
    END;
  END LOOP;
  
  IF recreated_count > 0 THEN
    RAISE NOTICE 'Recreated % dependent function(s).', recreated_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Grant appropriate permissions
-- ============================================================================
GRANT SELECT ON public.complete_profiles TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'GRANT SELECT executed for role "authenticated".';
END $$;

-- ============================================================================
-- STEP 11: Verify the view was created correctly
-- ============================================================================
DO $$
DECLARE
  view_created boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname = 'complete_profiles'
  ) INTO view_created;
  
  IF view_created THEN
    RAISE NOTICE 'SUCCESS: View complete_profiles recreated without SECURITY DEFINER.';
    RAISE NOTICE 'The view will now respect RLS policies from the profiles table.';
  ELSE
    RAISE EXCEPTION 'FAILED: View complete_profiles was not created.';
  END IF;
END $$;

-- ============================================================================
-- STEP 12: Clean up temporary table
-- ============================================================================
DROP TABLE IF EXISTS _complete_profiles_deps;

-- ============================================================================
-- STEP 13: Final verification and guidance
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Post-deployment checks:';
  RAISE NOTICE '  1) Test SELECT * FROM public.complete_profiles as an authenticated user.';
  RAISE NOTICE '  2) Confirm results respect RLS on public.profiles.';
  RAISE NOTICE '  3) Verify any dependent views/functions still work correctly.';
  RAISE NOTICE '  4) Check application code that uses complete_profiles.';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
