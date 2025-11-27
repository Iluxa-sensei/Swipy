-- ============================================
-- ОПТИМИЗИРОВАННАЯ ВЕРСИЯ БЕЗ БОЛЬШИХ ПОЛЕЙ
-- ============================================
-- Убираем image и logo_url из lightweight версии для скорости
-- Эти поля можно загрузить отдельно при необходимости

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

    -- Ограничиваем description до 200 символов для скорости
    -- image и logo_url оставляем, но они должны быть URL (небольшие строки)
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        LEFT(s.description, 200) as description,  -- Ограничиваем описание до 200 символов для скорости
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
-- ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ ОТДЕЛЬНО
-- ============================================
-- Используется для загрузки image и logo_url только когда нужно

CREATE OR REPLACE FUNCTION public.get_startup_images(
    p_startup_ids uuid[]
)
RETURNS TABLE (
    id uuid,
    image text,
    logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF p_startup_ids IS NULL OR array_length(p_startup_ids, 1) = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.image,
        s.logo_url
    FROM public.startups s
    WHERE s.id = ANY(p_startup_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startup_images(uuid[]) TO authenticated;

