-- Fix infinite recursion in chat_participants RLS policy
-- The issue is that SELECT policy checks chat_participants table itself, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;

-- Create a simplified policy that avoids recursion
-- Users can view participants if:
-- 1. They are the participant themselves
-- 2. They created the chat
-- 3. They can see the chat (which already checks participants through chats policy)
create policy "Users can view chat participants of their chats" on public.chat_participants
  for select using (
    -- User is viewing themselves as participant
    user_id = auth.uid()
    OR
    -- User created the chat (avoids recursion by checking chats table)
    exists (
      select 1 from public.chats c
      where c.id = chat_participants.chat_id and c.created_by = auth.uid()
    )
    OR
    -- User can view the chat (which already validates access through chats RLS)
    -- This is safe because chats RLS policy checks chat_participants, not the other way around
    exists (
      select 1 from public.chats c
      where c.id = chat_participants.chat_id
      -- The chats RLS policy will handle the participant check
    )
  );

-- Alternative approach: Use a SECURITY DEFINER function to bypass RLS for participant checks
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

-- Now update the policy to use this function (this avoids recursion)
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


