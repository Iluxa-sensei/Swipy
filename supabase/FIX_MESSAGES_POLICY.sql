-- Fix messages RLS policy to allow sending messages immediately after chat creation
-- This ensures users can send messages even if chat_participants check fails temporarily

-- Update INSERT policy for messages
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
create policy "Users can send messages to their chats" on public.messages
  for insert with check (
    sender_id = auth.uid() and (
      -- User is a participant
      exists (
        select 1 from public.chat_participants cp
        where cp.chat_id = messages.chat_id and cp.user_id = auth.uid()
      )
      OR
      -- User created the chat (allows sending messages immediately after RPC creation)
      exists (
        select 1 from public.chats c
        where c.id = messages.chat_id and c.created_by = auth.uid()
      )
    )
  );

-- Update SELECT policy for messages
DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
create policy "Users can read messages in their chats" on public.messages
  for select using (
    -- User is a participant
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = messages.chat_id and cp.user_id = auth.uid()
    )
    OR
    -- User created the chat (allows reading messages immediately after RPC creation)
    exists (
      select 1 from public.chats c
      where c.id = messages.chat_id and c.created_by = auth.uid()
    )
  );




