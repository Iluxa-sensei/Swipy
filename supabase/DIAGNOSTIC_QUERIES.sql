-- ============================================
-- ДИАГНОСТИЧЕСКИЕ ЗАПРОСЫ ДЛЯ ОТЛАДКИ
-- ============================================

-- 1. Проверка что функция существует
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_startups_lightweight_fast';

-- 2. Проверка количества стартапов в базе
SELECT COUNT(*) as total_startups FROM public.startups;

-- 3. Проверка первых 5 стартапов
SELECT id, name, created_at, owner_id 
FROM public.startups 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Проверка RLS политик для startups
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'startups';

-- 5. Проверка лайков/пассов текущего пользователя (замените YOUR_USER_ID)
-- SELECT 
--     (SELECT COUNT(*) FROM public.likes WHERE user_id = 'YOUR_USER_ID') as total_likes,
--     (SELECT COUNT(*) FROM public.passes WHERE user_id = 'YOUR_USER_ID') as total_passes;

-- 6. ВРЕМЕННАЯ ФУНКЦИЯ БЕЗ ИСКЛЮЧЕНИЙ (для тестирования)
-- Эта функция покажет ВСЕ стартапы, даже те что уже лайкнуты/пропущены
CREATE OR REPLACE FUNCTION public.get_startups_lightweight_fast_debug(
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
BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Input validation
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 5), 20));
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- ВАЖНО: Эта версия НЕ исключает лайкнутые/пропущенные стартапы
    -- Используется только для диагностики
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.industry, s.stage, s.funding_round,
           s.team_size, s.location, s.gradient, s.logo, s.created_at
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

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast_debug TO authenticated;

-- 7. Тест вызова функции (замените YOUR_USER_ID на реальный UUID пользователя)
-- SELECT * FROM public.get_startups_lightweight_fast_debug(5, 0, NULL, NULL, NULL, NULL, NULL);

