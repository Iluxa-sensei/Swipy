-- ============================================
-- ADD: likes_count and chat_count on startups
-- ============================================
-- Denormalized counters kept in sync by triggers.
-- Run once in Supabase SQL editor or via CLI.
-- ============================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS chat_count integer NOT NULL DEFAULT 0;

-- Backfill from existing data
UPDATE public.startups s
SET likes_count = (
  SELECT count(*)::integer FROM public.likes l WHERE l.startup_id = s.id
);

UPDATE public.startups s
SET chat_count = (
  SELECT count(*)::integer FROM public.chats c WHERE c.context_startup_id = s.id
);

-- ============================================
-- Trigger: keep likes_count in sync
-- ============================================

DROP FUNCTION IF EXISTS public.handle_likes_count_change() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_likes_count_change()
RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    UPDATE public.startups
    SET likes_count = likes_count + 1
    WHERE id = NEW.startup_id;
    RETURN NEW;
  ELSIF tg_op = 'DELETE' THEN
    UPDATE public.startups
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.startup_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_likes_count_change() SET search_path = '';

DROP TRIGGER IF EXISTS on_likes_count_change ON public.likes;
CREATE TRIGGER on_likes_count_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_likes_count_change();

-- ============================================
-- Trigger: keep chat_count in sync
-- ============================================

DROP FUNCTION IF EXISTS public.handle_chat_count_change() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_chat_count_change()
RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' AND NEW.context_startup_id IS NOT NULL THEN
    UPDATE public.startups
    SET chat_count = chat_count + 1
    WHERE id = NEW.context_startup_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_chat_count_change() SET search_path = '';

DROP TRIGGER IF EXISTS on_chat_count_change ON public.chats;
CREATE TRIGGER on_chat_count_change
  AFTER INSERT ON public.chats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_chat_count_change();
