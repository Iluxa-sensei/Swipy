-- Create RPC function to get chat info bypassing RLS
-- This ensures chat is accessible immediately after creation

create or replace function public.get_chat_info_rpc(p_chat_id uuid)
  returns jsonb as $$
  declare
    v_current_user uuid := auth.uid();
    v_chat_data jsonb;
    v_participants jsonb;
    v_result jsonb;
  begin
    if v_current_user is null then
      raise exception 'Not authenticated';
    end if;

    -- Get chat data (bypassing RLS with security definer)
    select jsonb_build_object(
      'id', c.id,
      'context_startup_id', c.context_startup_id,
      'created_by', c.created_by,
      'created_at', c.created_at,
      'startup', case 
        when c.context_startup_id is not null then
          (select jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'logo_url', s.logo_url,
            'logo', s.logo,
            'gradient', s.gradient,
            'owner_id', s.owner_id
          ) from public.startups s where s.id = c.context_startup_id)
        else null
      end
    ) into v_chat_data
    from public.chats c
    where c.id = p_chat_id;

    if v_chat_data is null then
      return null;
    end if;

    -- Check if user is a participant (for security)
    if not exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = v_current_user
    ) and not exists (
      select 1 from public.chats c
      where c.id = p_chat_id and c.created_by = v_current_user
    ) then
      raise exception 'Access denied: user is not a participant in this chat';
    end if;

    -- Get participants (bypassing RLS)
    select jsonb_agg(jsonb_build_object('user_id', cp.user_id)) into v_participants
    from public.chat_participants cp
    where cp.chat_id = p_chat_id;

    -- Build result
    v_result := v_chat_data || jsonb_build_object('participants', coalesce(v_participants, '[]'::jsonb));

    return v_result;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_chat_info_rpc(uuid) to authenticated;

