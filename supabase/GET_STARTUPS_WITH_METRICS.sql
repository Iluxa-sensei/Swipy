-- ============================================
-- ОПТИМИЗИРОВАННАЯ ФУНКЦИЯ С МЕТРИКАМИ
-- ============================================
-- Эта версия включает метрики (лайки и чаты) прямо в запрос
-- чтобы избежать дополнительного вызова get_startup_metrics_batch

-- Сначала удаляем старую функцию (так как изменился тип возврата)
DROP FUNCTION IF EXISTS public.get_startups_lightweight_fast(integer, integer, text[], text[], text[], text, text);

-- Создаем новую версию с метриками
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

    -- Return lightweight data WITH metrics in single query
    IF v_startup_ids IS NULL OR array_length(v_startup_ids, 1) = 0 THEN
        RETURN;
    END IF;

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
        COALESCE(l.likes_count, 0)::integer as likes_count,
        COALESCE(c.chat_count, 0)::integer as chat_count
    FROM public.startups s
    LEFT JOIN (
        SELECT startup_id, COUNT(*)::integer as likes_count
        FROM public.likes
        WHERE startup_id = ANY(v_startup_ids)
        GROUP BY startup_id
    ) l ON l.startup_id = s.id
    LEFT JOIN (
        SELECT context_startup_id as startup_id, COUNT(*)::integer as chat_count
        FROM public.chats
        WHERE context_startup_id IS NOT NULL
          AND context_startup_id = ANY(v_startup_ids)
        GROUP BY context_startup_id
    ) c ON c.startup_id = s.id
    WHERE s.id = ANY(v_startup_ids)
    ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast TO authenticated;

-- ============================================
-- ПРИМЕЧАНИЯ:
-- ============================================
-- 1. Теперь функция возвращает likes_count и chat_count прямо в результате
-- 2. Это устраняет необходимость в дополнительном вызове get_startup_metrics_batch
-- 3. Один запрос вместо двух = в 2 раза быстрее
-- 4. LEFT JOIN гарантирует что все стартапы вернутся, даже если у них нет лайков/чатов

