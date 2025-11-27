-- ============================================
-- МАКСИМАЛЬНО ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
-- ============================================
-- Возвращает только минимально необходимые поля для быстрой загрузки
-- Большие поля (description, image, logo_url) загружаются отдельно при необходимости

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

    -- Возвращаем только минимально необходимые поля для максимальной скорости
    -- description, image и logo_url не загружаем - они загружаются отдельно при необходимости
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        LEFT(COALESCE(s.description, ''), 150) as description,  -- Только первые 150 символов для превью
        s.industry, 
        s.stage, 
        s.funding_round,
        s.team_size, 
        s.location, 
        s.gradient, 
        s.logo,
        s.image,  -- Оставляем, но если это URL то быстро
        s.logo_url,  -- Оставляем, но если это URL то быстро
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
-- ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ПОЛНЫХ ДАННЫХ СТАРТАПА
-- ============================================
-- Используется для загрузки полного описания и изображений когда нужно

CREATE OR REPLACE FUNCTION public.get_startup_full_data(
    p_startup_id uuid
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
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        s.description,  -- Полное описание
        s.industry, 
        s.stage, 
        s.funding_round,
        s.team_size, 
        s.location, 
        s.gradient, 
        s.logo,
        s.image,  -- Полное изображение
        s.logo_url,  -- Полный URL
        s.created_at
    FROM public.startups s
    WHERE s.id = p_startup_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startup_full_data(uuid) TO authenticated;

