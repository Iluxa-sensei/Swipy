-- ============================================
-- OPTIMIZED SWIPE FUNCTIONS FOR PERFORMANCE
-- ============================================
-- These functions optimize the like/pass functionality to reduce database load
-- and improve performance while maintaining security.

-- ============================================
-- 1. OPTIMIZED LIKE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.like_startup_optimized(
  p_startup_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_startup_data jsonb;
BEGIN
  -- SECURITY: Only authenticated users
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate startup exists
  IF NOT EXISTS (SELECT 1 FROM public.startups WHERE id = p_startup_id) THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;

  -- Use UPSERT to handle like/pass conversion in single operation
  -- First, remove any existing pass
  DELETE FROM public.passes 
  WHERE user_id = v_user_id AND startup_id = p_startup_id;

  -- Insert like (will fail if already exists due to unique constraint)
  INSERT INTO public.likes (user_id, startup_id)
  VALUES (v_user_id, p_startup_id)
  ON CONFLICT (user_id, startup_id) DO NOTHING;

  -- Get minimal startup data for response (only what UI needs)
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'logo', s.logo,
    'gradient', s.gradient,
    'industry', s.industry,
    'stage', s.stage,
    'created_at', s.created_at
  ) INTO v_startup_data
  FROM public.startups s
  WHERE s.id = p_startup_id;

  -- Return success with minimal data
  RETURN jsonb_build_object(
    'success', true,
    'action', 'liked',
    'startup', v_startup_data,
    'timestamp', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- ============================================
-- 2. OPTIMIZED PASS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.pass_startup_optimized(
  p_startup_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_startup_data jsonb;
BEGIN
  -- SECURITY: Only authenticated users
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate startup exists
  IF NOT EXISTS (SELECT 1 FROM public.startups WHERE id = p_startup_id) THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;

  -- Use UPSERT to handle pass/like conversion in single operation
  -- First, remove any existing like
  DELETE FROM public.likes 
  WHERE user_id = v_user_id AND startup_id = p_startup_id;

  -- Insert pass (will fail if already exists due to unique constraint)
  INSERT INTO public.passes (user_id, startup_id)
  VALUES (v_user_id, p_startup_id)
  ON CONFLICT (user_id, startup_id) DO NOTHING;

  -- Get minimal startup data for response
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'logo', s.logo,
    'gradient', s.gradient,
    'industry', s.industry,
    'stage', s.stage,
    'created_at', s.created_at
  ) INTO v_startup_data
  FROM public.startups s
  WHERE s.id = p_startup_id;

  -- Return success with minimal data
  RETURN jsonb_build_object(
    'success', true,
    'action', 'passed',
    'startup', v_startup_data,
    'timestamp', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- ============================================
-- 3. BATCH SWIPE STATUS CHECK
-- ============================================

CREATE OR REPLACE FUNCTION public.get_swipe_status_batch(
  p_startup_ids uuid[]
)
RETURNS TABLE (
  startup_id uuid,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- SECURITY: Only authenticated users
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF p_startup_ids IS NULL OR array_length(p_startup_ids, 1) = 0 THEN
    RETURN;
  END IF;

  -- Check status for all startups in single query
  RETURN QUERY
  SELECT 
    s.id as startup_id,
    CASE 
      WHEN l.id IS NOT NULL THEN 'liked'
      WHEN p.id IS NOT NULL THEN 'passed'
      ELSE 'none'
    END as status
  FROM unnest(p_startup_ids) s(id)
  LEFT JOIN public.likes l ON l.user_id = v_user_id AND l.startup_id = s.id
  LEFT JOIN public.passes p ON p.user_id = v_user_id AND p.startup_id = s.id;
END;
$$;

-- ============================================
-- 4. LIGHTWEIGHT USER LIKES/PASSES
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_swipes_lightweight(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  startup_id uuid,
  action text,
  created_at timestamp with time zone,
  startup_name text,
  startup_logo text,
  startup_gradient text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- SECURITY: Only authenticated users
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate parameters
  IF p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Invalid limit parameter';
  END IF;
  
  IF p_offset < 0 THEN
    RAISE EXCEPTION 'Invalid offset parameter';
  END IF;

  -- Get both likes and passes in single query with minimal data
  RETURN QUERY
  (
    SELECT 
      l.id,
      l.startup_id,
      'liked'::text as action,
      l.created_at,
      s.name as startup_name,
      s.logo as startup_logo,
      s.gradient as startup_gradient
    FROM public.likes l
    JOIN public.startups s ON s.id = l.startup_id
    WHERE l.user_id = v_user_id
    
    UNION ALL
    
    SELECT 
      p.id,
      p.startup_id,
      'passed'::text as action,
      p.created_at,
      s.name as startup_name,
      s.logo as startup_logo,
      s.gradient as startup_gradient
    FROM public.passes p
    JOIN public.startups s ON s.id = p.startup_id
    WHERE p.user_id = v_user_id
  )
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================
-- 5. PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_user_created_desc ON public.likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passes_user_created_desc ON public.passes(user_id, created_at DESC);

-- Index for batch status checks
CREATE INDEX IF NOT EXISTS idx_likes_startup_user ON public.likes(startup_id, user_id);
CREATE INDEX IF NOT EXISTS idx_passes_startup_user ON public.passes(startup_id, user_id);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.like_startup_optimized(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pass_startup_optimized(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_swipe_status_batch(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_swipes_lightweight(integer, integer) TO authenticated;

-- ============================================
-- 7. RATE LIMITING TABLE (Optional)
-- ============================================

-- Create rate limiting table to prevent spam
CREATE TABLE IF NOT EXISTS public.swipe_rate_limits (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_count integer DEFAULT 0,
  window_start timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_swipe_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_count integer;
  v_window_start timestamp with time zone;
  v_limit integer := 100; -- 100 swipes per hour
  v_window_hours integer := 1;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get current rate limit data
  SELECT action_count, window_start
  INTO v_current_count, v_window_start
  FROM public.swipe_rate_limits
  WHERE user_id = v_user_id;

  -- Reset window if expired
  IF v_current_count IS NULL OR v_window_start < now() - (v_window_hours || ' hours')::interval THEN
    INSERT INTO public.swipe_rate_limits (user_id, action_count, window_start)
    VALUES (v_user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      action_count = 1,
      window_start = now();
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= v_limit THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE public.swipe_rate_limits
  SET action_count = action_count + 1
  WHERE user_id = v_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_swipe_rate_limit() TO authenticated;
