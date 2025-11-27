-- ============================================
-- КРИТИЧЕСКИЕ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================
-- Эти индексы критически важны для быстрой работы запросов

-- Индексы для likes (для исключения лайкнутых стартапов)
CREATE INDEX IF NOT EXISTS idx_likes_user_startup ON public.likes(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_created ON public.likes(user_id, created_at DESC);

-- Индексы для passes (для исключения пропущенных стартапов)
CREATE INDEX IF NOT EXISTS idx_passes_user_startup ON public.passes(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_created ON public.passes(user_id, created_at DESC);

-- Индекс для сортировки стартапов по дате создания
CREATE INDEX IF NOT EXISTS idx_startups_created_at_desc ON public.startups(created_at DESC);

-- Составной индекс для фильтрации и сортировки
CREATE INDEX IF NOT EXISTS idx_startups_filters_created ON public.startups(created_at DESC, industry, stage, location) 
WHERE industry IS NOT NULL AND stage IS NOT NULL AND location IS NOT NULL;

-- Индексы для метрик (лайки и чаты)
CREATE INDEX IF NOT EXISTS idx_likes_startup_count ON public.likes(startup_id);
CREATE INDEX IF NOT EXISTS idx_chats_startup_count ON public.chats(context_startup_id) 
WHERE context_startup_id IS NOT NULL;

-- ============================================
-- АНАЛИЗ ТАБЛИЦ ДЛЯ ОПТИМАЛЬНОГО ПЛАНИРОВАНИЯ ЗАПРОСОВ
-- ============================================
ANALYZE public.startups;
ANALYZE public.likes;
ANALYZE public.passes;
ANALYZE public.chats;

