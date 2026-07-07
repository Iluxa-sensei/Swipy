-- Newsletter subscribers table and unsubscribe-by-token RPC
-- Run in Supabase SQL Editor or via migration tooling.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subscribed boolean not null default true,
  unsubscribe_token text not null,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint newsletter_subscribers_email_unique unique (email),
  constraint newsletter_subscribers_unsubscribe_token_unique unique (unsubscribe_token)
);

create index if not exists newsletter_subscribers_unsubscribe_token_idx
  on public.newsletter_subscribers (unsubscribe_token);

create index if not exists newsletter_subscribers_subscribed_idx
  on public.newsletter_subscribers (subscribed)
  where subscribed = true;

-- Auto-generate secure unsubscribe token on insert
create or replace function public.set_newsletter_unsubscribe_token()
returns trigger
language plpgsql
as $$
begin
  if new.unsubscribe_token is null or trim(new.unsubscribe_token) = '' then
    new.unsubscribe_token := replace(
      gen_random_uuid()::text || gen_random_uuid()::text,
      '-',
      ''
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists newsletter_subscribers_set_token on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_token
  before insert on public.newsletter_subscribers
  for each row execute function public.set_newsletter_unsubscribe_token();

-- Keep updated_at in sync on updates
create or replace function public.set_newsletter_subscriber_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_newsletter_subscriber_updated_at();

alter table public.newsletter_subscribers enable row level security;

-- No public policies: direct table access is denied for anon/authenticated.
-- Unsubscribe is handled only via SECURITY DEFINER RPC or service role.

create or replace function public.unsubscribe_newsletter(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscriber public.newsletter_subscribers%rowtype;
  v_token text := trim(coalesce(p_token, ''));
begin
  if v_token = '' or length(v_token) < 32 or length(v_token) > 128 then
    return jsonb_build_object('status', 'invalid_token');
  end if;

  if v_token !~ '^[A-Za-z0-9_-]+$' then
    return jsonb_build_object('status', 'invalid_token');
  end if;

  select *
  into v_subscriber
  from public.newsletter_subscribers
  where unsubscribe_token = v_token
  limit 1;

  if not found then
    return jsonb_build_object('status', 'invalid_token');
  end if;

  if v_subscriber.subscribed = false then
    return jsonb_build_object('status', 'already_unsubscribed');
  end if;

  update public.newsletter_subscribers
  set
    subscribed = false,
    unsubscribed_at = now(),
    updated_at = now()
  where id = v_subscriber.id;

  return jsonb_build_object('status', 'success');
end;
$$;

revoke all on function public.unsubscribe_newsletter(text) from public;
grant execute on function public.unsubscribe_newsletter(text) to anon, authenticated, service_role;
