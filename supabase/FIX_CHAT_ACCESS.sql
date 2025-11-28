-- Fix chat access issue after creation
-- This script ensures that chats created via RPC are immediately accessible

-- 1. Update RLS policy for chats to also allow viewing chats created by user
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
create policy "Users can view their chats" on public.chats
  for select using (
    -- User is a participant
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = id and cp.user_id = auth.uid()
    )
    OR
    -- User created the chat (allows immediate access after RPC creation)
    created_by = auth.uid()
  );

-- 2. Ensure chat_participants INSERT policy allows RPC functions to work
DROP POLICY IF EXISTS "Users can add participants to their chats" ON public.chat_participants;
create policy "Users can add participants to their chats" on public.chat_participants
  for insert with check (
    -- User created the chat
    exists (
      select 1 from public.chats c 
      where c.id = chat_id and c.created_by = auth.uid()
    )
    OR
    -- User is adding themselves (for RPC functions)
    user_id = auth.uid()
  );

-- 3. Fix infinite recursion in chat_participants SELECT policy
-- Create a SECURITY DEFINER helper function to check participation without recursion
create or replace function public.user_is_chat_participant(p_chat_id uuid, p_user_id uuid)
  returns boolean as $$
  declare
    v_is_participant boolean;
  begin
    -- This function bypasses RLS with SECURITY DEFINER
    select exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = p_user_id
    ) into v_is_participant;
    
    return v_is_participant;
  end;
  $$ language plpgsql security definer;

grant execute on function public.user_is_chat_participant(uuid, uuid) to authenticated;

-- Update chat_participants SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
create policy "Users can view chat participants of their chats" on public.chat_participants
  for select using (
    -- User is viewing themselves as participant
    user_id = auth.uid()
    OR
    -- User created the chat
    exists (
      select 1 from public.chats c
      where c.id = chat_participants.chat_id and c.created_by = auth.uid()
    )
    OR
    -- Use SECURITY DEFINER function to check participation (bypasses RLS recursion)
    public.user_is_chat_participant(chat_participants.chat_id, auth.uid())
  );

-- 4. Improve the RPC function to ensure proper participant insertion
create or replace function public.get_or_create_user_chat(p_target_user_id uuid)
  returns uuid as $$
  declare
    v_current_user uuid := auth.uid();
    v_chat_id uuid;
    v_participant_count integer;
  begin
    if v_current_user is null then
      raise exception 'Not authenticated';
    end if;

    if v_current_user = p_target_user_id then
      raise exception 'Cannot create chat with yourself';
    end if;

    -- Find existing direct chat between users (no startup context)
    select c.id into v_chat_id
    from public.chats c
    where c.context_startup_id is null
      and exists (
        select 1 from public.chat_participants cp1
        where cp1.chat_id = c.id and cp1.user_id = v_current_user
      )
      and exists (
        select 1 from public.chat_participants cp2
        where cp2.chat_id = c.id and cp2.user_id = p_target_user_id
      )
    limit 1;

    if v_chat_id is null then
      -- Create new chat
      insert into public.chats (context_startup_id, created_by)
      values (null, v_current_user)
      returning id into v_chat_id;

      -- Add both users as participants
      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, v_current_user)
      on conflict do nothing;

      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, p_target_user_id)
      on conflict do nothing;

      -- Verify participants were added (with a small delay to ensure transaction commit)
      perform pg_sleep(0.1);
      
      select count(*) into v_participant_count
      from public.chat_participants
      where chat_id = v_chat_id;

      if v_participant_count < 2 then
        raise exception 'Failed to add all participants to chat';
      end if;
    end if;

    return v_chat_id;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_or_create_user_chat(uuid) to authenticated;

-- 5. Create RPC function to get chat info bypassing RLS
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

-- 6. Create a helper function to verify chat access
create or replace function public.verify_chat_access(p_chat_id uuid)
  returns boolean as $$
  declare
    v_current_user uuid := auth.uid();
    v_has_access boolean := false;
  begin
    if v_current_user is null then
      return false;
    end if;

    -- Check if user is a participant
    select exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = v_current_user
    ) into v_has_access;

    -- Also check if user created the chat
    if not v_has_access then
      select exists (
        select 1 from public.chats c
        where c.id = p_chat_id and c.created_by = v_current_user
      ) into v_has_access;
    end if;

    return v_has_access;
  end;
  $$ language plpgsql security definer;

grant execute on function public.verify_chat_access(uuid) to authenticated;

