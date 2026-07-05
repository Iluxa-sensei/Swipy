-- ============================================
-- VERIFY + RECONCILE: likes_count/chat_count
-- ============================================
-- Run these checks after deploying counter triggers.

-- 1) Startups where likes_count differs from real likes rows
SELECT
  s.id,
  s.name,
  s.likes_count AS stored_likes_count,
  COUNT(l.id)::integer AS actual_likes_count
FROM public.startups s
LEFT JOIN public.likes l ON l.startup_id = s.id
GROUP BY s.id, s.name, s.likes_count
HAVING s.likes_count <> COUNT(l.id)::integer
ORDER BY s.name;

-- 2) Startups where chat_count differs from real chats rows
SELECT
  s.id,
  s.name,
  s.chat_count AS stored_chat_count,
  COUNT(c.id)::integer AS actual_chat_count
FROM public.startups s
LEFT JOIN public.chats c ON c.context_startup_id = s.id
GROUP BY s.id, s.name, s.chat_count
HAVING s.chat_count <> COUNT(c.id)::integer
ORDER BY s.name;

-- 3) Reconcile likes_count in-place (safe to run multiple times)
UPDATE public.startups s
SET likes_count = sub.actual_likes_count
FROM (
  SELECT startup_id, COUNT(*)::integer AS actual_likes_count
  FROM public.likes
  GROUP BY startup_id
) sub
WHERE s.id = sub.startup_id
  AND s.likes_count <> sub.actual_likes_count;

-- Ensure startups with zero likes are also corrected
UPDATE public.startups s
SET likes_count = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.likes l WHERE l.startup_id = s.id
)
  AND s.likes_count <> 0;

-- 4) Reconcile chat_count in-place (safe to run multiple times)
UPDATE public.startups s
SET chat_count = sub.actual_chat_count
FROM (
  SELECT context_startup_id AS startup_id, COUNT(*)::integer AS actual_chat_count
  FROM public.chats
  WHERE context_startup_id IS NOT NULL
  GROUP BY context_startup_id
) sub
WHERE s.id = sub.startup_id
  AND s.chat_count <> sub.actual_chat_count;

-- Ensure startups with zero chats are also corrected
UPDATE public.startups s
SET chat_count = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.chats c WHERE c.context_startup_id = s.id
)
  AND s.chat_count <> 0;
