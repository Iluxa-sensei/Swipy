-- ============================================================
-- Chat & Metrics Enhancements
-- ============================================================
-- Run this script in Supabase SQL Editor after deploying code.
-- It adds:
--   * aggregated startup metrics RPC
--   * direct user-to-user chat RPC
--   * helper view for chat metadata
-- All functions run as SECURITY DEFINER with search_path fixed
-- for safety against RLS bypass via malicious schemas.
-- ============================================================

create or replace function public.get_startup_metrics_batch(
    p_startup_ids uuid[]
)
returns table (
    startup_id uuid,
    likes_count integer,
    chat_count integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    if p_startup_ids is null or array_length(p_startup_ids, 1) = 0 then
        return;
    end if;

    return query
    with metrics as (
        select
            s.id as startup_id,
            coalesce(l.likes_count, 0) as likes_count,
            coalesce(c.chat_count, 0) as chat_count
        from public.startups s
        left join (
            select startup_id, count(*)::int as likes_count
            from public.likes
            where startup_id = any(p_startup_ids)
            group by startup_id
        ) l on l.startup_id = s.id
        left join (
            select context_startup_id as startup_id, count(*)::int as chat_count
            from public.chats
            where context_startup_id is not null
              and context_startup_id = any(p_startup_ids)
            group by context_startup_id
        ) c on c.startup_id = s.id
        where s.id = any(p_startup_ids)
    )
    select * from metrics;
end;
$$;

grant execute on function public.get_startup_metrics_batch(uuid[]) to authenticated;

-- ============================================================
-- Direct chat between any two authenticated users
-- ============================================================

create or replace function public.start_or_get_direct_chat(
    p_target_user_id uuid,
    p_context_startup_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_chat_id uuid;
begin
    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    if p_target_user_id is null or p_target_user_id = v_user_id then
        raise exception 'Invalid target user';
    end if;

    -- look for existing chat with same participants & optional startup context
    select c.id
    into v_chat_id
    from public.chats c
    join public.chat_participants cp1 on cp1.chat_id = c.id and cp1.user_id = v_user_id
    join public.chat_participants cp2 on cp2.chat_id = c.id and cp2.user_id = p_target_user_id
    where coalesce(c.context_startup_id, '00000000-0000-0000-0000-000000000000') =
          coalesce(p_context_startup_id, '00000000-0000-0000-0000-000000000000')
    order by c.created_at desc
    limit 1;

    if v_chat_id is null then
        insert into public.chats (context_startup_id, created_by)
        values (p_context_startup_id, v_user_id)
        returning id into v_chat_id;

        insert into public.chat_participants (chat_id, user_id)
        values (v_chat_id, v_user_id)
        on conflict do nothing;

        insert into public.chat_participants (chat_id, user_id)
        values (v_chat_id, p_target_user_id)
        on conflict do nothing;
    end if;

    return v_chat_id;
end;
$$;

grant execute on function public.start_or_get_direct_chat(uuid, uuid) to authenticated;

-- ============================================================
-- Lightweight chat metadata view (used by get_chat_info RPC)
-- ============================================================

create or replace view public.chat_context_view
with (security_invoker = on)
as
select
    c.id as chat_id,
    c.context_startup_id,
    c.created_by,
    c.created_at,
    array(
        select cp.user_id
        from public.chat_participants cp
        where cp.chat_id = c.id
        order by cp.user_id
    ) as participant_ids
from public.chats c;

grant select on public.chat_context_view to authenticated;


