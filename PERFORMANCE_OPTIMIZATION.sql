-- ============================================
-- PERFORMANCE OPTIMIZATIONS FOR STARTUPS
-- ============================================
-- 
-- Этот файл содержит SQL оптимизации для ускорения загрузки стартапов.
-- Выполните эти команды в Supabase SQL Editor для применения оптимизаций.
--
-- ВАЖНО: Не забудьте сделать backup базы данных перед выполнением!

-- ============================================
-- 1. ИНДЕКСЫ ДЛЯ БЫСТРОЙ ФИЛЬТРАЦИИ И СОРТИРОВКИ
-- ============================================

-- Основной индекс для сортировки по дате создания (уже создан как PRIMARY KEY, но добавим для DESC)
CREATE INDEX IF NOT EXISTS idx_startups_created_at_desc ON public.startups(created_at DESC);

-- Индексы для полей фильтрации
CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_stage ON public.startups(stage) WHERE stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_location ON public.startups(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_team_size ON public.startups(team_size) WHERE team_size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_funding_round ON public.startups(funding_round) WHERE funding_round IS NOT NULL;

-- Составной индекс для частых комбинаций фильтров
CREATE INDEX IF NOT EXISTS idx_startups_filters_composite ON public.startups(industry, stage, location, created_at DESC) 
  WHERE industry IS NOT NULL AND stage IS NOT NULL AND location IS NOT NULL;

-- Индексы для исключения уже просмотренных стартапов
CREATE INDEX IF NOT EXISTS idx_likes_user_startup ON public.likes(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_startup ON public.passes(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passes_created_at ON public.passes(created_at DESC);

-- ============================================
-- 2. ОПТИМИЗИРОВАННАЯ ФУНКЦИЯ ДЛЯ ПАГИНАЦИИ
-- ============================================

-- Функция для получения стартапов с исключениями и фильтрами (безопасная и быстрая)
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
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text;
  v_conditions text[] := ARRAY[]::text[];
BEGIN
  -- БЕЗОПАСНОСТЬ: Только для аутентифицированных пользователей
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Валидация входных параметров для защиты от SQL injection
  IF p_limit < 1 OR p_limit > 20 THEN
    RAISE EXCEPTION 'Invalid limit parameter';
  END IF;
  
  IF p_offset < 0 THEN
    RAISE EXCEPTION 'Invalid offset parameter';
  END IF;

  -- Построение динамического запроса для производительности
  v_query := 'SELECT s.* FROM public.startups s WHERE 1=1';
  
  -- Добавление условий фильтрации
  IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
    v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
  END IF;
  
  IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
    v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
  END IF;
  
  IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
    v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
  END IF;
  
  IF p_team_size IS NOT NULL THEN
    v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
  END IF;
  
  IF p_funding_round IS NOT NULL THEN
    v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
  END IF;
  
  -- Добавление условий к запросу если применены фильтры
  IF array_length(v_conditions, 1) > 0 THEN
    v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
  END IF;
  
  -- Исключение стартапов, которые пользователь уже лайкнул или пропустил
  v_query := v_query || format(' AND NOT EXISTS (
    SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
  )', v_user_id, v_user_id);
  
  -- Добавление сортировки и пагинации
  v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
  
  -- Выполнение запроса безопасно
  RETURN QUERY EXECUTE v_query;
END;
$$;

-- Предоставление разрешений на выполнение функции
GRANT EXECUTE ON FUNCTION public.get_startups_paginated TO authenticated;

-- ============================================
-- 3. ФУНКЦИЯ ДЛЯ ПОДСЧЕТА ОБЩЕГО КОЛИЧЕСТВА
-- ============================================

CREATE OR REPLACE FUNCTION public.get_startups_count(
  p_industry text[] DEFAULT NULL,
  p_stage text[] DEFAULT NULL,
  p_location text[] DEFAULT NULL,
  p_team_size text DEFAULT NULL,
  p_funding_round text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text;
  v_conditions text[] := ARRAY[]::text[];
  v_count integer;
BEGIN
  -- БЕЗОПАСНОСТЬ: Только для аутентифицированных пользователей
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Построение условий для подсчета (та же логика что и в get_startups_paginated)
  v_query := 'SELECT COUNT(*)::integer FROM public.startups s WHERE 1=1';
  
  -- Добавление условий фильтрации (та же логика что и в основной функции)
  IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
    v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
  END IF;
  
  IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
    v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
  END IF;
  
  IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
    v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
  END IF;
  
  IF p_team_size IS NOT NULL THEN
    v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
  END IF;
  
  IF p_funding_round IS NOT NULL THEN
    v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
  END IF;
  
  -- Добавление условий к запросу если применены фильтры
  IF array_length(v_conditions, 1) > 0 THEN
    v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
  END IF;
  
  -- Исключение стартапов, которые пользователь уже лайкнул или пропустил
  v_query := v_query || format(' AND NOT EXISTS (
    SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
  )', v_user_id, v_user_id);
  
  -- Выполнение запроса безопасно
  EXECUTE v_query INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_count TO authenticated;

-- ============================================
-- 4. ЛЕГКАЯ ФУНКЦИЯ ДЛЯ СПИСКА СТАРТАПОВ
-- ============================================

-- Функция для получения только основных полей для быстрой загрузки
CREATE OR REPLACE FUNCTION public.get_startups_lightweight(
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
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text;
  v_conditions text[] := ARRAY[]::text[];
BEGIN
  -- БЕЗОПАСНОСТЬ: Только для аутентифицированных пользователей
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Валидация параметров
  IF p_limit < 1 OR p_limit > 20 THEN
    RAISE EXCEPTION 'Invalid limit parameter';
  END IF;
  
  IF p_offset < 0 THEN
    RAISE EXCEPTION 'Invalid offset parameter';
  END IF;

  -- Построение оптимизированного запроса с только основными полями
  v_query := 'SELECT s.id, s.name, s.description, s.industry, s.stage, s.funding_round, 
                     s.team_size, s.location, s.gradient, s.logo, s.created_at 
              FROM public.startups s WHERE 1=1';
  
  -- Добавление условий фильтрации (та же логика что и в основной функции но для легкой версии)
  IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
    v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
  END IF;
  
  IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
    v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
  END IF;
  
  IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
    v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
  END IF;
  
  IF p_team_size IS NOT NULL THEN
    v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
  END IF;
  
  IF p_funding_round IS NOT NULL THEN
    v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
  END IF;
  
  -- Добавление условий к запросу если применены фильтры
  IF array_length(v_conditions, 1) > 0 THEN
    v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
  END IF;
  
  -- Исключение стартапов, которые пользователь уже лайкнул или пропустил
  v_query := v_query || format(' AND NOT EXISTS (
    SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
  )', v_user_id, v_user_id);
  
  -- Добавление сортировки и пагинации
  v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
  
  -- Выполнение запроса безопасно
  RETURN QUERY EXECUTE v_query;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_lightweight TO authenticated;

-- ============================================
-- ПРОВЕРКА ПРИМЕНЕНИЯ ОПТИМИЗАЦИЙ
-- ============================================

-- Проверьте что индексы созданы:
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('startups', 'likes', 'passes') 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Проверьте что функции созданы:
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname LIKE 'get_startups_%' 
ORDER BY proname;
