-- ============================================
-- УЛЬТРА-БЫСТРАЯ ВЕРСИЯ БЕЗ ИСКЛЮЧЕНИЙ (для теста)
-- ============================================
-- Эта версия НЕ исключает лайкнутые/пропущенные стартапы
-- Используется для диагностики - если эта версия быстрая, значит проблема в запросе исключений

DROP FUNCTION IF EXISTS public.get_startups_lightweight_fast(integer, integer, text[], text[], text[], text, text);

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
    image text,
    logo_url text,
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
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Input validation
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- ВРЕМЕННО: НЕ исключаем лайкнутые/пропущенные для максимальной скорости
    -- Просто возвращаем все стартапы с фильтрами
    
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
        s.image,
        s.logo_url,
        s.created_at,
        0::integer as likes_count,
        0::integer as chat_count
    FROM public.startups s
    WHERE (p_industry IS NULL OR s.industry = ANY(p_industry))
      AND (p_stage IS NULL OR s.stage = ANY(p_stage))
      AND (p_location IS NULL OR s.location = ANY(p_location))
      AND (p_team_size IS NULL OR s.team_size = p_team_size)
      AND (p_funding_round IS NULL OR s.funding_round = p_funding_round)
    ORDER BY s.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast TO authenticated;

-- ============================================
-- ОПТИМИЗИРОВАННАЯ ВЕРСИЯ С ИСКЛЮЧЕНИЯМИ (использует NOT EXISTS вместо != ALL)
-- ============================================

-- Удаляем старую версию если существует
DROP FUNCTION IF EXISTS public.get_startups_lightweight_fast_with_exclusions(integer, integer, text[], text[], text[], text, text);

CREATE OR REPLACE FUNCTION public.get_startups_lightweight_fast_with_exclusions(
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
    image text,
    logo_url text,
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
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Input validation
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- Используем NOT EXISTS вместо != ALL - это быстрее для больших массивов
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
        s.image,
        s.logo_url,
        s.created_at,
        0::integer as likes_count,
        0::integer as chat_count
    FROM public.startups s
    WHERE NOT EXISTS (
        SELECT 1 FROM public.likes l 
        WHERE l.user_id = v_user_id AND l.startup_id = s.id
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.passes p 
        WHERE p.user_id = v_user_id AND p.startup_id = s.id
    )
    AND (p_industry IS NULL OR s.industry = ANY(p_industry))
    AND (p_stage IS NULL OR s.stage = ANY(p_stage))
    AND (p_location IS NULL OR s.location = ANY(p_location))
    AND (p_team_size IS NULL OR s.team_size = p_team_size)
    AND (p_funding_round IS NULL OR s.funding_round = p_funding_round)
    ORDER BY s.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast_with_exclusions TO authenticated;

-- ============================================
-- ПРОВЕРКА ИНДЕКСОВ
-- ============================================
-- Убедись что эти индексы существуют для быстрого поиска:

-- CREATE INDEX IF NOT EXISTS idx_likes_user_startup ON public.likes(user_id, startup_id);
-- CREATE INDEX IF NOT EXISTS idx_passes_user_startup ON public.passes(user_id, startup_id);
-- CREATE INDEX IF NOT EXISTS idx_startups_created_at_desc ON public.startups(created_at DESC);

