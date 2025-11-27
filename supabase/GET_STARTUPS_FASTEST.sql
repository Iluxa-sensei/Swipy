-- ============================================
-- САМАЯ БЫСТРАЯ ВЕРСИЯ БЕЗ image и logo_url
-- ============================================
-- Эти поля могут содержать большие данные (base64 или длинные URL)
-- Загружаем их отдельно только когда нужно

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

    -- Возвращаем данные БЕЗ image и logo_url для максимальной скорости
    -- description ограничен до 150 символов
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        LEFT(COALESCE(s.description, ''), 150) as description,
        s.industry, 
        s.stage, 
        s.funding_round,
        s.team_size, 
        s.location, 
        s.gradient, 
        s.logo,
        NULL::text as image,  -- НЕ загружаем - может быть очень большим
        NULL::text as logo_url,  -- НЕ загружаем - может быть очень большим
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

