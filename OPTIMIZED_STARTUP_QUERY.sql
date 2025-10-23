-- ============================================
-- ULTRA-FAST STARTUP QUERY OPTIMIZATION
-- ============================================
-- This replaces the slow get_startups_paginated function with optimized versions

-- Drop the old slow function
DROP FUNCTION IF EXISTS public.get_startups_paginated(integer, integer, text[], text[], text[], text, text);

-- ============================================
-- 1. ENHANCED INDEXES FOR MAXIMUM PERFORMANCE
-- ============================================

-- Drop existing indexes to recreate them optimized
DROP INDEX IF EXISTS idx_startups_created_at_desc;
DROP INDEX IF EXISTS idx_startups_filters_composite;
DROP INDEX IF EXISTS idx_likes_user_startup;
DROP INDEX IF EXISTS idx_passes_user_startup;

-- Create optimized composite indexes for the most common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_startups_created_at_desc_optimized 
ON public.startups(created_at DESC) 
INCLUDE (id, name, description, industry, stage, location, team_size, funding_round, gradient, logo);

-- Optimized index for user exclusions (most critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_startup_optimized 
ON public.likes(user_id, startup_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passes_user_startup_optimized 
ON public.passes(user_id, startup_id, created_at DESC);

-- Partial indexes for common filter combinations (only index non-null values)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_startups_industry_partial 
ON public.startups(created_at DESC, id) 
WHERE industry IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_startups_stage_partial 
ON public.startups(created_at DESC, id) 
WHERE stage IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_startups_location_partial 
ON public.startups(created_at DESC, id) 
WHERE location IS NOT NULL;

-- ============================================
-- 2. ULTRA-FAST PAGINATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_startups_paginated_fast(
    p_limit integer DEFAULT 5,
    p_offset integer DEFAULT 0,
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    owner_id uuid,
    slug text,
    name text,
    description text,
    website text,
    logo_url text,
    logo text,
    industry text,
    category text,
    stage text,
    funding_round text,
    funding text,
    team_size text,
    "teamSize" text,
    location text,
    gradient text,
    investment_required text,
    investment_percentage numeric(5,2),
    ebitda numeric(12,2),
    image text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- Mark as stable for better query planning
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_startup_ids uuid[];
    v_excluded_ids uuid[];
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Input validation and sanitization
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20)); -- Limit between 1-20
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- First, get excluded startup IDs (much faster than NOT EXISTS)
    SELECT ARRAY_AGG(startup_id) INTO v_excluded_ids
    FROM (
        SELECT startup_id FROM public.likes WHERE user_id = v_user_id
        UNION
        SELECT startup_id FROM public.passes WHERE user_id = v_user_id
    ) excluded;

    -- If no exclusions, set to empty array
    v_excluded_ids := COALESCE(v_excluded_ids, ARRAY[]::uuid[]);

    -- Get startup IDs with filters using optimized query
    WITH filtered_startups AS (
        SELECT s.id
        FROM public.startups s
        WHERE s.id != ALL(v_excluded_ids)
          AND (p_industry IS NULL OR s.industry = ANY(p_industry))
          AND (p_stage IS NULL OR s.stage = ANY(p_stage))
          AND (p_location IS NULL OR s.location = ANY(p_location))
          AND (p_team_size IS NULL OR s.team_size = p_team_size)
          AND (p_funding_round IS NULL OR s.funding_round = p_funding_round)
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT ARRAY_AGG(id) INTO v_startup_ids FROM filtered_startups;

    -- If no results, return empty
    IF v_startup_ids IS NULL OR array_length(v_startup_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Return full startup data for the filtered IDs (single query)
    RETURN QUERY
    SELECT s.*
    FROM public.startups s
    WHERE s.id = ANY(v_startup_ids)
    ORDER BY s.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_startups_paginated_fast TO authenticated;

-- ============================================
-- 3. LIGHTWEIGHT VERSION FOR INITIAL LOAD
-- ============================================

CREATE OR REPLACE FUNCTION public.get_startups_lightweight_fast(
    p_limit integer DEFAULT 5,
    p_offset integer DEFAULT 0,
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    industry text,
    stage text,
    funding_round text,
    team_size text,
    location text,
    gradient text,
    logo text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_startup_ids uuid[];
    v_excluded_ids uuid[];
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Input validation
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- Get excluded startup IDs
    SELECT ARRAY_AGG(startup_id) INTO v_excluded_ids
    FROM (
        SELECT startup_id FROM public.likes WHERE user_id = v_user_id
        UNION
        SELECT startup_id FROM public.passes WHERE user_id = v_user_id
    ) excluded;

    v_excluded_ids := COALESCE(v_excluded_ids, ARRAY[]::uuid[]);

    -- Get filtered startup IDs
    WITH filtered_startups AS (
        SELECT s.id
        FROM public.startups s
        WHERE s.id != ALL(v_excluded_ids)
          AND (p_industry IS NULL OR s.industry = ANY(p_industry))
          AND (p_stage IS NULL OR s.stage = ANY(p_stage))
          AND (p_location IS NULL OR s.location = ANY(p_location))
          AND (p_team_size IS NULL OR s.team_size = p_team_size)
          AND (p_funding_round IS NULL OR s.funding_round = p_funding_round)
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT ARRAY_AGG(id) INTO v_startup_ids FROM filtered_startups;

    -- Return lightweight data
    IF v_startup_ids IS NULL OR array_length(v_startup_ids, 1) = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT s.id, s.name, s.description, s.industry, s.stage, s.funding_round,
           s.team_size, s.location, s.gradient, s.logo, s.created_at
    FROM public.startups s
    WHERE s.id = ANY(v_startup_ids)
    ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast TO authenticated;

-- ============================================
-- 4. CACHED COUNT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_startups_count_cached(
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_excluded_ids uuid[];
    v_count integer;
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Get excluded startup IDs
    SELECT ARRAY_AGG(startup_id) INTO v_excluded_ids
    FROM (
        SELECT startup_id FROM public.likes WHERE user_id = v_user_id
        UNION
        SELECT startup_id FROM public.passes WHERE user_id = v_user_id
    ) excluded;

    v_excluded_ids := COALESCE(v_excluded_ids, ARRAY[]::uuid[]);

    -- Count filtered startups
    SELECT COUNT(*)::integer INTO v_count
    FROM public.startups s
    WHERE s.id != ALL(v_excluded_ids)
      AND (p_industry IS NULL OR s.industry = ANY(p_industry))
      AND (p_stage IS NULL OR s.stage = ANY(p_stage))
      AND (p_location IS NULL OR s.location = ANY(p_location))
      AND (p_team_size IS NULL OR s.team_size = p_team_size)
      AND (p_funding_round IS NULL OR s.funding_round = p_funding_round);

    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_count_cached TO authenticated;

-- ============================================
-- 5. RATE LIMITING AND SECURITY
-- ============================================

-- Create a simple rate limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, endpoint)
);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_endpoint text DEFAULT 'startups',
    p_max_requests integer DEFAULT 100,
    p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_current_count integer;
    v_window_start timestamp with time zone;
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get current rate limit data
    SELECT request_count, window_start
    INTO v_current_count, v_window_start
    FROM public.api_rate_limits
    WHERE user_id = v_user_id AND endpoint = p_endpoint;

    -- If no record or window expired, reset
    IF v_current_count IS NULL OR 
       v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
        INSERT INTO public.api_rate_limits (user_id, endpoint, request_count, window_start)
        VALUES (v_user_id, p_endpoint, 1, now())
        ON CONFLICT (user_id, endpoint)
        DO UPDATE SET 
            request_count = 1,
            window_start = now();
        RETURN true;
    END IF;

    -- Check if limit exceeded
    IF v_current_count >= p_max_requests THEN
        RETURN false;
    END IF;

    -- Increment counter
    UPDATE public.api_rate_limits
    SET request_count = request_count + 1
    WHERE user_id = v_user_id AND endpoint = p_endpoint;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;

-- ============================================
-- 6. FINAL OPTIMIZED FUNCTION WITH RATE LIMITING
-- ============================================

CREATE OR REPLACE FUNCTION public.get_startups_paginated(
    p_limit integer DEFAULT 5,
    p_offset integer DEFAULT 0,
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    owner_id uuid,
    slug text,
    name text,
    description text,
    website text,
    logo_url text,
    logo text,
    industry text,
    category text,
    stage text,
    funding_round text,
    funding text,
    team_size text,
    "teamSize" text,
    location text,
    gradient text,
    investment_required text,
    investment_percentage numeric(5,2),
    ebitda numeric(12,2),
    image text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_rate_limited boolean;
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check rate limit (100 requests per minute)
    SELECT public.check_rate_limit('startups', 100, 1) INTO v_rate_limited;
    IF NOT v_rate_limited THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;

    -- Input validation and sanitization
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- Call the fast implementation
    RETURN QUERY
    SELECT * FROM public.get_startups_paginated_fast(
        p_limit, p_offset, p_industry, p_stage, p_location, p_team_size, p_funding_round
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_paginated TO authenticated;

-- ============================================
-- 7. CLEANUP OLD FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS public.get_startups_count(integer, integer, text[], text[], text[], text, text);
DROP FUNCTION IF EXISTS public.get_startups_lightweight(integer, integer, text[], text[], text[], text, text);

-- ============================================
-- 8. ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- ============================================

ANALYZE public.startups;
ANALYZE public.likes;
ANALYZE public.passes;

-- ============================================
-- PERFORMANCE NOTES:
-- ============================================
-- 1. Uses array operations instead of NOT EXISTS for better performance
-- 2. Two-step approach: get IDs first, then fetch full data
-- 3. Optimized indexes with INCLUDE columns for covering indexes
-- 4. Rate limiting to prevent abuse
-- 5. Input validation and sanitization
-- 6. STABLE functions for better query planning
-- 7. Concurrent index creation to avoid blocking
-- 8. Partial indexes for common filter patterns
