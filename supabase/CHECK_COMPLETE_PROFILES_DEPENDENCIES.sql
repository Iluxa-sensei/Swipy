-- ============================================================================
-- Diagnostic Script: Check dependencies on complete_profiles view
-- ============================================================================
-- Run this FIRST to see what depends on the view before making changes
-- ============================================================================

-- Check if view exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relkind = 'v'
        AND n.nspname = 'public'
        AND c.relname = 'complete_profiles'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END AS view_status;

-- List ALL dependencies on complete_profiles view
SELECT 
  d.deptype,
  CASE d.deptype
    WHEN 'n' THEN 'normal (explicit dependency)'
    WHEN 'a' THEN 'auto (automatic dependency)'
    WHEN 'i' THEN 'internal (system dependency)'
    WHEN 'p' THEN 'pin (pinned dependency)'
    ELSE 'unknown'
  END AS dependency_type,
  depn.nspname AS dependent_schema,
  depc.relname AS dependent_name,
  CASE depc.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'f' THEN 'function'
    WHEN 'p' THEN 'procedure'
    WHEN 'm' THEN 'materialized view'
    WHEN 'S' THEN 'sequence'
    ELSE 'other (' || depc.relkind || ')'
  END AS dependent_type,
  pg_get_userbyid(depc.relowner) AS owner
FROM pg_depend d
JOIN pg_class refc ON d.refobjid = refc.oid
JOIN pg_namespace refn ON refc.relnamespace = refn.oid
JOIN pg_class depc ON d.objid = depc.oid
JOIN pg_namespace depn ON depc.relnamespace = depn.oid
WHERE refn.nspname = 'public'
  AND refc.relname = 'complete_profiles'
  AND d.deptype IN ('n','a','i','p')
ORDER BY depc.relkind, depc.relname;

-- Show view definition (if it exists)
SELECT 
  pg_get_viewdef('public.complete_profiles'::regclass, true) AS current_view_definition;

-- Count dependencies by type
SELECT 
  CASE depc.relkind
    WHEN 'v' THEN 'views'
    WHEN 'f' THEN 'functions'
    WHEN 'p' THEN 'procedures'
    WHEN 'r' THEN 'tables'
    ELSE 'other'
  END AS dependency_category,
  COUNT(*) AS count
FROM pg_depend d
JOIN pg_class refc ON d.refobjid = refc.oid
JOIN pg_namespace refn ON refc.relnamespace = refn.oid
JOIN pg_class depc ON d.objid = depc.oid
WHERE refn.nspname = 'public'
  AND refc.relname = 'complete_profiles'
  AND d.deptype IN ('n','a','i','p')
GROUP BY depc.relkind
ORDER BY count DESC;
