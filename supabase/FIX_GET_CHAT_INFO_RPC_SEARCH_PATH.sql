-- ============================================================================
-- Fix get_chat_info_rpc function to work with SET search_path = ''
-- ============================================================================
-- This ensures the function works correctly after applying search_path security
-- ============================================================================

-- Update get_chat_info_rpc to ensure it works with SET search_path = ''
-- Note: auth.uid() should work without explicit qualification, but we ensure all tables are qualified

CREATE OR REPLACE FUNCTION public.get_chat_info_rpc(p_chat_id uuid)
  RETURNS jsonb AS $$
  DECLARE
    v_current_user uuid := auth.uid();
    v_chat_data jsonb;
    v_participants jsonb;
    v_result jsonb;
  BEGIN
    IF v_current_user IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get chat data (bypassing RLS with security definer)
    SELECT jsonb_build_object(
      'id', c.id,
      'context_startup_id', c.context_startup_id,
      'created_by', c.created_by,
      'created_at', c.created_at,
      'startup', CASE 
        WHEN c.context_startup_id IS NOT NULL THEN
          (SELECT jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'logo_url', s.logo_url,
            'logo', s.logo,
            'gradient', s.gradient,
            'owner_id', s.owner_id
          ) FROM public.startups s WHERE s.id = c.context_startup_id)
        ELSE NULL
      END
    ) INTO v_chat_data
    FROM public.chats c
    WHERE c.id = p_chat_id;

    IF v_chat_data IS NULL THEN
      RETURN NULL;
    END IF;

    -- Check if user is a participant (for security)
    IF NOT EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = p_chat_id AND cp.user_id = v_current_user
    ) AND NOT EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = p_chat_id AND c.created_by = v_current_user
    ) THEN
      RAISE EXCEPTION 'Access denied: user is not a participant in this chat';
    END IF;

    -- Get participants (bypassing RLS)
    SELECT jsonb_agg(jsonb_build_object('user_id', cp.user_id)) INTO v_participants
    FROM public.chat_participants cp
    WHERE cp.chat_id = p_chat_id;

    -- Build result
    v_result := v_chat_data || jsonb_build_object('participants', COALESCE(v_participants, '[]'::jsonb));

    RETURN v_result;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = '';

GRANT EXECUTE ON FUNCTION public.get_chat_info_rpc(uuid) TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This function now has SET search_path = '' which prevents search path injection
-- 2. All table references use explicit schema qualification (public.chats, etc.)
-- 3. auth.uid() works without explicit qualification as it's a system function
-- 4. This ensures the function works correctly after applying FIX_FUNCTION_SEARCH_PATH_AND_RLS.sql
-- ============================================================================

