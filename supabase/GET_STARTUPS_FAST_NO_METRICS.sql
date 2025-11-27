-- ============================================
-- БЫСТРАЯ ВЕРСИЯ БЕЗ МЕТРИК (для устранения таймаутов)
-- ============================================
-- Подзапросы для метрик очень медленные, поэтому убираем их
-- Метрики можно загрузить отдельно через get_startup_metrics_batch если нужно

-- Удаляем текущую версию
DROP FUNCTION IF EXISTS public.get_startups_lightweight_fast(integer, integer, text[], text[], text[], text, text);

-- Создаем БЫСТРУЮ версию БЕЗ метрик
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
    created_at timestamp with time zone,
    likes_count integer,
    chat_count integer
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

    -- Return lightweight data WITHOUT metrics (быстро!)
    IF v_startup_ids IS NULL OR array_length(v_startup_ids, 1) = 0 THEN
        RETURN;
    END IF;

    -- Простой запрос БЕЗ подзапросов - очень быстро
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        s.description, 
        s.industry, 
        s.stage, 
        s.funding_round,
        s.team_size, 
        s.location, 
        s.gradient, 
        s.logo, 
        s.created_at,
        0::integer as likes_count,  -- Временно 0, загрузим отдельно если нужно
        0::integer as chat_count     -- Временно 0, загрузим отдельно если нужно
    FROM public.startups s
    WHERE s.id = ANY(v_startup_ids)
    ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast TO authenticated;

-- ============================================
-- ПРИМЕЧАНИЯ:
-- ============================================
-- 1. Функция возвращает likes_count=0 и chat_count=0
-- 2. Метрики можно загрузить отдельно через get_startup_metrics_batch если нужно
-- 3. Это намного быстрее чем подзапросы для каждой строки
-- 4. После загрузки данных можно вызвать _enrichStartupsWithMetrics для получения метрик

