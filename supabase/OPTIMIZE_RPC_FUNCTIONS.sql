-- ============================================
-- ОПТИМИЗАЦИЯ RPC ФУНКЦИЙ ДЛЯ БЫСТРОЙ ЗАГРУЗКИ
-- ============================================
-- Добавляем SET search_path для безопасности и производительности
-- Это предотвращает медленные запросы через pgrst_source CTE

-- Обновляем get_startups_lightweight_fast
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
SET search_path = public
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

    -- Get excluded startup IDs (лайкнутые и пропущенные)
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

-- Обновляем get_startups_paginated_fast
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
SET search_path = public
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

    -- Input validation and sanitization
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- First, get excluded startup IDs (much faster than NOT EXISTS)
    SELECT ARRAY_AGG(startup_id) INTO v_excluded_ids
    FROM (
        SELECT startup_id FROM public.likes WHERE user_id = v_user_id
        UNION
        SELECT startup_id FROM public.passes WHERE user_id = v_user_id
    ) excluded;

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

GRANT EXECUTE ON FUNCTION public.get_startups_paginated_fast TO authenticated;

-- Обновляем get_startups_paginated (wrapper с rate limiting)
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
SET search_path = public
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
    RETURN QUERY SELECT * FROM public.get_startups_paginated_fast(
        p_limit, p_offset, p_industry, p_stage, p_location, p_team_size, p_funding_round
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_paginated TO authenticated;

-- ============================================
-- ПРИМЕЧАНИЯ ПО ОПТИМИЗАЦИИ:
-- ============================================
-- 1. SET search_path = public предотвращает медленные запросы через pgrst_source CTE
-- 2. Использование ARRAY_AGG вместо NOT EXISTS значительно быстрее
-- 3. Двухэтапный подход: сначала получаем ID, потом полные данные
-- 4. STABLE функции позволяют планировщику лучше оптимизировать запросы
-- 5. Rate limiting защищает от злоупотреблений

