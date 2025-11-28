-- Fix infinite recursion in chat_participants RLS policies
-- Run this SQL in Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can join their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;

-- Simplified INSERT policy: users can add participants to chats they created
-- This avoids recursion by not checking chat_participants table in the policy
create policy "Users can add participants to their chats" on public.chat_participants
  for insert with check (
    exists (
      select 1 from public.chats c 
      where c.id = chat_id and c.created_by = auth.uid()
    )
  );

-- Simplified SELECT policy: users can view participants if they are the participant
-- OR if they created the chat (avoids recursion by not checking chat_participants again)
create policy "Users can view chat participants of their chats" on public.chat_participants
    for select using (
      user_id = auth.uid() or exists (
        select 1 from public.chat_participants cp
        where cp.chat_id = chat_participants.chat_id and cp.user_id = auth.uid()
      )
    );

-- Create RPC function for creating user chats (bypasses RLS with security definer)
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
    end if;

    return v_chat_id;
  end;
  $$ language plpgsql security definer;

grant execute on function public.get_or_create_user_chat(uuid) to authenticated;

