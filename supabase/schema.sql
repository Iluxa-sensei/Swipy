-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles table (1-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text,
  avatar_url text,
  bio text,
  location text,
  website text,
  role text,
  interests text[],
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Startups table
create table if not exists public.startups (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  website text,
  logo_url text,
  industry text,
  stage text,
  funding_round text,
  team_size text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Likes (user likes startup)
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  startup_id uuid not null references public.startups(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, startup_id)
);

-- Passes (user passes startup)
create table if not exists public.passes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  startup_id uuid not null references public.startups(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, startup_id)
);

-- Chats
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now()
);

-- Chat participants
create table if not exists public.chat_participants (
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key(chat_id, user_id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, -- 'like', 'match', 'message', 'system'
  read boolean default false,
  data jsonb, -- Additional data for the notification
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.startups enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Policies: profiles (self only)
create policy "Profiles are viewable by users themselves" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can upsert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies: startups
create policy "Startups are readable by authenticated" on public.startups
  for select using (auth.role() = 'authenticated');
create policy "Owners can insert startups" on public.startups
  for insert with check (auth.uid() = owner_id);
create policy "Owners can update their startups" on public.startups
  for update using (auth.uid() = owner_id);
create policy "Owners can delete their startups" on public.startups
  for delete using (auth.uid() = owner_id);

-- Policies: likes and passes (user-owned)
create policy "Users can manage their likes" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their passes" on public.passes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: chats
create policy "Users can view their chats" on public.chats
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = id and cp.user_id = auth.uid()
    )
  );

-- Participants policy
create policy "Users can view chat participants of their chats" on public.chat_participants
  for select using (
    user_id = auth.uid() or exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chat_id and cp.user_id = auth.uid()
    )
  );

-- Messages policy
create policy "Users can read messages in their chats" on public.messages
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chat_id and cp.user_id = auth.uid()
    )
  );
create policy "Users can send messages to their chats" on public.messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chat_id and cp.user_id = auth.uid()
    )
  );

-- Notifications policy
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications
  for insert with check (true);

-- Triggers to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'startups_set_updated_at'
  ) then
    create trigger startups_set_updated_at
      before update on public.startups
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'profiles_set_updated_at'
  ) then
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', null);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle startup like notifications
create or replace function public.handle_startup_like()
returns trigger as $$
begin
  -- Only notify if it's a new like
  if (tg_op = 'INSERT') then
    insert into public.notifications (user_id, title, message, type, data)
    select 
      s.owner_id,
      'New Like!',
      'Someone liked your startup "' || s.name || '"',
      'like',
      jsonb_build_object('startup_id', s.id, 'startup_name', s.name, 'liker_id', new.user_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for startup likes
drop trigger if exists on_startup_like on public.likes;
create trigger on_startup_like
  after insert on public.likes
  for each row execute procedure public.handle_startup_like();

-- Function to handle mutual matches
create or replace function public.handle_mutual_match()
returns trigger as $$
declare
  startup_owner_id uuid;
begin
  -- Get startup owner
  select owner_id into startup_owner_id from public.startups where id = new.startup_id;
  
  -- Check if startup owner also liked the liker's startup
  if exists (
    select 1 from public.likes l
    join public.startups s on l.startup_id = s.id
    where l.user_id = startup_owner_id and s.owner_id = new.user_id
  ) then
    -- It's a match! Notify both users
    insert into public.notifications (user_id, title, message, type, data)
    values 
      (new.user_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match', 
       jsonb_build_object('startup_id', new.startup_id, 'matched_user_id', startup_owner_id)),
      (startup_owner_id, 'It''s a Match!', 'You and another founder liked each other''s startups!', 'match',
       jsonb_build_object('startup_id', new.startup_id, 'matched_user_id', new.user_id));
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for mutual matches
drop trigger if exists on_mutual_match on public.likes;
create trigger on_mutual_match
  after insert on public.likes
  for each row execute procedure public.handle_mutual_match();


