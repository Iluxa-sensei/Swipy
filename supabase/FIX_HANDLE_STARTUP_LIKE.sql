-- ============================================
-- FIX: handle_startup_like() function
-- ============================================
-- This fixes the "missing FROM-clause entry for table 's'" error
-- that occurs when liking a startup.
--
-- The issue was that the function used table alias 's' without
-- declaring it in a FROM clause.
-- ============================================

-- Drop and recreate the function with proper variable declarations
DROP FUNCTION IF EXISTS public.handle_startup_like() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_startup_like()
RETURNS trigger AS $$
DECLARE
  v_owner_id uuid;
  v_startup_name text;
  v_startup_id uuid;
BEGIN
  -- Only notify if it's a new like
  IF (tg_op = 'INSERT') THEN
    -- Get startup info
    SELECT owner_id, name, id INTO v_owner_id, v_startup_name, v_startup_id
    FROM public.startups
    WHERE id = new.startup_id;
    
    -- Only create notification if owner exists and is not the same as liker
    IF v_owner_id IS NOT NULL AND v_owner_id != new.user_id THEN
      INSERT INTO public.notifications (user_id, title, message, type, data)
      VALUES (
        v_owner_id,
        'New Like!',
        'Someone liked your startup "' || v_startup_name || '"',
        'like',
        jsonb_build_object('startup_id', v_startup_id, 'startup_name', v_startup_name, 'liker_id', new.user_id)
      );
    END IF;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_startup_like ON public.likes;
CREATE TRIGGER on_startup_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_startup_like();

-- ============================================
-- VERIFY
-- ============================================
-- After running this, test by liking a startup.
-- The notification should be created without errors.

