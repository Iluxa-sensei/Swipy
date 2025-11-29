-- ULTIMATE FIX: Complete chat system without RLS recursion
-- This approach completely eliminates recursion by simplifying RLS policies
-- and using RPC functions for complex operations

-- ============================================
-- STEP 1: Drop all existing problematic policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can add participants to their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

-- ============================================
-- STEP 2: Create ULTRA-SIMPLE policies without recursion
-- ============================================

-- CHATS: Ultra-simple policy - only check created_by
create policy "Users can view chats they created" on public.chats
  for select using (created_by = auth.uid());

create policy "Users can create chats" on public.chats
  for insert with check (created_by = auth.uid());

-- CHAT_PARTICIPANTS: Ultra-simple - only check user_id
-- No recursion possible because we don't check chat_participants or chats
create policy "Users can view themselves as participants" on public.chat_participants
  for select using (user_id = auth.uid());

create policy "Users can add themselves as participants" on public.chat_participants
  for insert with check (user_id = auth.uid());

-- MESSAGES: Simple policy using SECURITY DEFINER function
-- Messages policy doesn't cause recursion because it uses a function
create policy "Users can read messages" on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = messages.chat_id and c.created_by = auth.uid()
    )
  );

create policy "Users can send messages" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.chats c
      where c.id = messages.chat_id and c.created_by = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Create RPC functions with SECURITY DEFINER
-- These bypass RLS completely for complex operations
-- ============================================

-- Function to get user's chats (bypasses RLS)
create or replace function public.get_user_chats_simple(p_user_id uuid)
  returns table (
    chat_id uuid,
    context_startup_id uuid,
    created_by uuid,
    created_at timestamptz,
    other_user_id uuid
  ) as $$
  begin
    return query
    select 
      c.id as chat_id,
      c.context_startup_id,
      c.created_by,
      c.created_at,
      (select cp2.user_id from public.chat_participants cp2 
       where cp2.chat_id = c.id and cp2.user_id != p_user_id limit 1) as other_user_id
    from public.chats c
    where exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = c.id and cp.user_id = p_user_id
    )
    order by c.created_at desc;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_user_chats_simple(uuid) to authenticated;

-- Function to get chat participants (bypasses RLS)
create or replace function public.get_chat_participants_simple(p_chat_id uuid)
  returns table (user_id uuid) as $$
  begin
    -- Check if caller has access to this chat
    if not exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = auth.uid()
    ) and not exists (
      select 1 from public.chats c
      where c.id = p_chat_id and c.created_by = auth.uid()
    ) then
      raise exception 'Access denied';
    end if;

    return query
    select cp.user_id
    from public.chat_participants cp
    where cp.chat_id = p_chat_id;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_chat_participants_simple(uuid) to authenticated;

-- Function to get chat messages (bypasses RLS)
create or replace function public.get_chat_messages_simple(p_chat_id uuid)
  returns table (
    id uuid,
    chat_id uuid,
    sender_id uuid,
    body text,
    created_at timestamptz
  ) as $$
  begin
    -- Check if caller has access to this chat
    if not exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = auth.uid()
    ) and not exists (
      select 1 from public.chats c
      where c.id = p_chat_id and c.created_by = auth.uid()
    ) then
      raise exception 'Access denied';
    end if;

    return query
    select m.id, m.chat_id, m.sender_id, m.body, m.created_at
    from public.messages m
    where m.chat_id = p_chat_id
    order by m.created_at asc;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_chat_messages_simple(uuid) to authenticated;

-- Function to send message (bypasses RLS)
create or replace function public.send_message_simple(
  p_chat_id uuid,
  p_body text
)
  returns uuid as $$
  declare
    v_message_id uuid;
    v_sender_id uuid := auth.uid();
  begin
    -- Check if caller has access to this chat
    if not exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = v_sender_id
    ) and not exists (
      select 1 from public.chats c
      where c.id = p_chat_id and c.created_by = v_sender_id
    ) then
      raise exception 'Access denied: You are not a participant in this chat';
    end if;

    -- Insert message
    insert into public.messages (chat_id, sender_id, body)
    values (p_chat_id, v_sender_id, p_body)
    returning id into v_message_id;

    return v_message_id;
  end;
  $$ language plpgsql security definer;

grant execute on function public.send_message_simple(uuid, text) to authenticated;

-- ============================================
-- STEP 4: Update get_or_create_user_chat to work with new policies
-- ============================================

create or replace function public.get_or_create_user_chat(p_target_user_id uuid)
  returns uuid as $$
  declare
    v_current_user uuid := auth.uid();
    v_chat_id uuid;
  begin
    if v_current_user is null then
      raise exception 'Not authenticated';
    end if;

    if v_current_user = p_target_user_id then
      raise exception 'Cannot create chat with yourself';
    end if;

    -- Find existing direct chat between users
    select c.id into v_chat_id
    from public.chats c
    where c.context_startup_id is null
      and c.created_by in (v_current_user, p_target_user_id)
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
      values (v_chat_id, v_current_user), (v_chat_id, p_target_user_id);
    end if;

    return v_chat_id;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_or_create_user_chat(uuid) to authenticated;

-- ============================================
-- STEP 5: Update get_chat_info_rpc to work with new approach
-- ============================================

create or replace function public.get_chat_info_rpc(p_chat_id uuid)
  returns jsonb as $$
  declare
    v_current_user uuid := auth.uid();
    v_result jsonb;
  begin
    if v_current_user is null then
      raise exception 'Not authenticated';
    end if;

    -- Check access
    if not exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = p_chat_id and cp.user_id = v_current_user
    ) and not exists (
      select 1 from public.chats c
      where c.id = p_chat_id and c.created_by = v_current_user
    ) then
      raise exception 'Access denied';
    end if;

    -- Build result
    select jsonb_build_object(
      'id', c.id,
      'context_startup_id', c.context_startup_id,
      'created_by', c.created_by,
      'created_at', c.created_at,
      'participants', (
        select jsonb_agg(jsonb_build_object('user_id', cp.user_id))
        from public.chat_participants cp
        where cp.chat_id = c.id
      ),
      'startup', case 
        when c.context_startup_id is not null then
          (select row_to_json(s.*) from public.startups s where s.id = c.context_startup_id)
        else null
      end
    ) into v_result
    from public.chats c
    where c.id = p_chat_id;

    return v_result;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_chat_info_rpc(uuid) to authenticated;


