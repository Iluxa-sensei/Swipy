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
    slug text,
    name text not null,
    description text,
    website text,
    logo_url text,
    logo text,
    industry text,
    category text,
    stage text,
    funding_round text,
    funding text,
    team_size text,
    teamSize text,
    location text,
    gradient text default 'bg-gradient-to-br from-blue-300 to-blue-700',
    pitch_deck_url text,
    investment_required text,
    investment_percentage numeric(5,2), -- percentage of company (e.g., 10.50 for 10.5%)
    ebitda numeric(12,2), -- EBITDA in USD/month
    image text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
  );

  -- If table already existed previously, ensure the slug column exists
  alter table public.startups add column if not exists slug text;
  alter table public.startups add column if not exists investment_required text;
  alter table public.startups add column if not exists investment_percentage numeric(5,2);
  alter table public.startups add column if not exists ebitda numeric(12,2);
  alter table public.startups add column if not exists pitch_deck_url text;

  -- Ensure unique slug per owner (avoids chat URL collisions)
  create unique index if not exists startups_owner_slug_unique
    on public.startups(owner_id, coalesce(nullif(slug,''), name));

  -- Utility: slugify text
  create or replace function public.slugify(input text)
  returns text as $$
  declare
    s text := lower(coalesce(input, ''));
  begin
    -- replace non-alphanumeric with hyphens and trim
    s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
    s := trim(both '-' from s);
    if s = '' then
      s := 'startup';
    end if;
    return s;
  end;
  $$ language plpgsql immutable;

  -- Before insert/update: ensure slug is populated and unique per owner
  create or replace function public.ensure_startup_slug()
  returns trigger as $$
  declare
    base_slug text;
    candidate text;
    suffix int := 0;
  begin
    if new.slug is null or new.slug = '' then
      base_slug := public.slugify(new.name);
    else
      base_slug := public.slugify(new.slug);
    end if;

    candidate := base_slug;
    while exists (
      select 1 from public.startups s
      where s.owner_id = coalesce(new.owner_id, old.owner_id)
        and coalesce(s.slug, s.name) = candidate
        and s.id <> coalesce(new.id, old.id)
    ) loop
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix::text;
    end loop;

    new.slug := candidate;
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists startups_ensure_slug on public.startups;
  create trigger startups_ensure_slug
    before insert or update of name, slug on public.startups
    for each row execute procedure public.ensure_startup_slug();

  -- Likes (user likes startup)
  create table if not exists public.likes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    startup_id uuid not null references public.startups(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, startup_id)
  );

  -- Starred jobs (user bookmarks external jobs)
  create table if not exists public.starred_jobs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    job_id text not null,
    job_data jsonb not null,
    created_at timestamp with time zone default now(),
    unique(user_id, job_id)
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
    context_startup_id uuid references public.startups(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
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
  alter table public.starred_jobs enable row level security;
  alter table public.chats enable row level security;
  alter table public.chat_participants enable row level security;
  alter table public.messages enable row level security;
  alter table public.notifications enable row level security;

  -- Policies: profiles (self only)
  DROP POLICY IF EXISTS "Profiles are viewable by users themselves" ON public.profiles;
  DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

  create policy "Profiles are viewable by users themselves" on public.profiles
    for select using (auth.uid() = id);
  create policy "Users can upsert their own profile" on public.profiles
    for insert with check (auth.uid() = id);
  create policy "Users can update their own profile" on public.profiles
    for update using (auth.uid() = id);

  -- Allow reading other profiles when authenticated (for chat and list views)
  create policy "Profiles are viewable by authenticated users" on public.profiles
    for select using (auth.role() = 'authenticated');

  -- Policies: startups
  DROP POLICY IF EXISTS "Startups are readable by authenticated" ON public.startups;
  DROP POLICY IF EXISTS "Owners can insert startups" ON public.startups;
  DROP POLICY IF EXISTS "Owners can update their startups" ON public.startups;
  DROP POLICY IF EXISTS "Owners can delete their startups" ON public.startups;

  create policy "Startups are readable by authenticated" on public.startups
    for select using (auth.role() = 'authenticated');
  create policy "Owners can insert startups" on public.startups
    for insert with check (auth.uid() = owner_id);
  create policy "Owners can update their startups" on public.startups
    for update using (auth.uid() = owner_id);
  create policy "Owners can delete their startups" on public.startups
    for delete using (auth.uid() = owner_id);

  -- Policies: likes and passes (user-owned)
  DROP POLICY IF EXISTS "Users can manage their likes" ON public.likes;
  DROP POLICY IF EXISTS "Users can manage their passes" ON public.passes;

  create policy "Users can manage their likes" on public.likes
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "Users can manage their passes" on public.passes
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  -- Policies: starred jobs (user-owned)
  DROP POLICY IF EXISTS "Users can manage their starred jobs" ON public.starred_jobs;
  create policy "Users can manage their starred jobs" on public.starred_jobs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  -- Policies: chats
  DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
  DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

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

  -- Allow users to create chats they are part of
  DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
  create policy "Users can create chats" on public.chats
    for insert with check (
      created_by = auth.uid()
    );

  -- Allow users to insert participants into chats they created
  -- Simplified to avoid recursion: users can add anyone to chats they created
  DROP POLICY IF EXISTS "Users can join their chats" ON public.chat_participants;
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

  -- Participants policy - simplified to avoid recursion
  -- Users can view participants if they are the participant themselves
  -- OR if they created the chat
  DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;

  -- Helper function to check participation without recursion
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

  -- Messages policy
  DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
  DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

  create policy "Users can read messages in their chats" on public.messages
    for select using (
      -- User is a participant
      exists (
        select 1 from public.chat_participants cp
        where cp.chat_id = chat_id and cp.user_id = auth.uid()
      )
      OR
      -- User created the chat (allows reading messages immediately after RPC creation)
      exists (
        select 1 from public.chats c
        where c.id = chat_id and c.created_by = auth.uid()
      )
    );
  create policy "Users can send messages to their chats" on public.messages
    for insert with check (
      sender_id = auth.uid() and (
        -- User is a participant
        exists (
          select 1 from public.chat_participants cp
          where cp.chat_id = chat_id and cp.user_id = auth.uid()
        )
        OR
        -- User created the chat (allows sending messages immediately after RPC creation)
        exists (
          select 1 from public.chats c
          where c.id = chat_id and c.created_by = auth.uid()
        )
      )
    );

  -- Notifications policy
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

  create policy "Users can view their own notifications" on public.notifications
    for select using (auth.uid() = user_id);
  create policy "Users can update their own notifications" on public.notifications
    for update using (auth.uid() = user_id);

  DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
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

  DROP TRIGGER IF EXISTS startups_set_updated_at ON public.startups;
  create trigger startups_set_updated_at
    before update on public.startups
    for each row execute procedure public.set_updated_at();

  DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
  create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute procedure public.set_updated_at();

  -- Clean up any legacy triggers that reference NEW.user_id on startups
  do $$ begin
    if exists (select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid where t.tgrelid = 'public.startups'::regclass and p.proname ilike '%user%') then
      -- Attempt to drop broadly named triggers safely
      execute 'drop trigger if exists update_profile_completion_on_startups on public.startups';
    end if;
  exception when others then
    -- ignore
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
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- Function to handle startup like notifications
  create or replace function public.handle_startup_like()
  returns trigger as $$
  declare
    v_owner_id uuid;
    v_startup_name text;
    v_startup_id uuid;
  begin
    -- Only notify if it's a new like
    if (tg_op = 'INSERT') then
      -- Get startup info
      select owner_id, name, id into v_owner_id, v_startup_name, v_startup_id
      from public.startups
      where id = new.startup_id;
      
      -- Only create notification if owner exists and is not the same as liker
      if v_owner_id is not null and v_owner_id != new.user_id then
        insert into public.notifications (user_id, title, message, type, data)
        values (
          v_owner_id,
          'New Like!',
          'Someone liked your startup "' || v_startup_name || '"',
          'like',
          jsonb_build_object('startup_id', v_startup_id, 'startup_name', v_startup_name, 'liker_id', new.user_id)
        );
      end if;
    end if;
    return new;
  end;
  $$ language plpgsql security definer;

  -- Trigger for startup likes
  DROP TRIGGER IF EXISTS on_startup_like ON public.likes;
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
  DROP TRIGGER IF EXISTS on_mutual_match ON public.likes;
  create trigger on_mutual_match
    after insert on public.likes
    for each row execute procedure public.handle_mutual_match();


  -- Helper to start or get a chat bound to a startup context
  create or replace function public.start_or_get_chat(p_startup_id uuid)
  returns uuid as $$
  declare
    v_initiator uuid := auth.uid();
    v_owner uuid;
    v_chat_id uuid;
  begin
    if v_initiator is null then
      raise exception 'Not authenticated';
    end if;

    select owner_id into v_owner from public.startups where id = p_startup_id;
    if v_owner is null then
      raise exception 'Startup not found';
    end if;

    -- Find existing chat between initiator and owner for this startup
    select c.id into v_chat_id
    from public.chats c
    where c.context_startup_id = p_startup_id
      and exists (
        select 1 from public.chat_participants cp1
        where cp1.chat_id = c.id and cp1.user_id = v_initiator
      )
      and exists (
        select 1 from public.chat_participants cp2
        where cp2.chat_id = c.id and cp2.user_id = v_owner
      )
    limit 1;

    if v_chat_id is null then
      insert into public.chats (context_startup_id, created_by)
      values (p_startup_id, v_initiator)
      returning id into v_chat_id;

      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, v_initiator)
      on conflict do nothing;

      insert into public.chat_participants (chat_id, user_id)
      values (v_chat_id, v_owner)
      on conflict do nothing;
    end if;

    return v_chat_id;
  end;
  $$ language plpgsql security definer;

  grant execute on function public.start_or_get_chat(uuid) to authenticated;

  -- Helper to create or get a direct chat between two users
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

      -- Small delay to ensure transaction is committed before returning
      -- This helps with RLS policy visibility
      perform pg_sleep(0.05);
    end if;

    return v_chat_id;
  end;
  $$ language plpgsql security definer;

  grant execute on function public.get_or_create_user_chat(uuid) to authenticated;

  -- RPC function to get chat info bypassing RLS
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

  -- ============================================
  -- PERFORMANCE OPTIMIZATIONS FOR STARTUPS
  -- ============================================
  
  -- Indexes for faster filtering and sorting
  CREATE INDEX IF NOT EXISTS idx_startups_created_at_desc ON public.startups(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_startups_industry ON public.startups(industry) WHERE industry IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_startups_stage ON public.startups(stage) WHERE stage IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_startups_location ON public.startups(location) WHERE location IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_startups_team_size ON public.startups(team_size) WHERE team_size IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_startups_funding_round ON public.startups(funding_round) WHERE funding_round IS NOT NULL;
  
  -- Composite index for common filter combinations
  CREATE INDEX IF NOT EXISTS idx_startups_filters_composite ON public.startups(industry, stage, location, created_at DESC) 
    WHERE industry IS NOT NULL AND stage IS NOT NULL AND location IS NOT NULL;
  
  -- Index for user swipes to exclude already seen startups
  CREATE INDEX IF NOT EXISTS idx_likes_user_startup ON public.likes(user_id, startup_id);
  CREATE INDEX IF NOT EXISTS idx_passes_user_startup ON public.passes(user_id, startup_id);
  CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_passes_created_at ON public.passes(created_at DESC);

  -- ============================================
  -- OPTIMIZED FUNCTION FOR STARTUP PAGINATION
  -- ============================================
  
  -- Function to get startups with exclusions and filters (secure and fast)
  CREATE OR REPLACE FUNCTION public.get_startups_paginated(
    p_limit integer DEFAULT 5,
    p_offset integer DEFAULT 0,
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
  )
  RETURNS TABLE (
    id uuid,
    owner_id uuid,
    slug text,
    name text,
    description text,
    website text,
    logo_url text,
    logo text,
    industry text,
    category text,
    stage text,
    funding_round text,
    funding text,
    team_size text,
    "teamSize" text,
    location text,
    gradient text,
    investment_required text,
    investment_percentage numeric(5,2),
    ebitda numeric(12,2),
    image text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_user_id uuid := auth.uid();
    v_query text;
    v_conditions text[] := ARRAY[]::text[];
  BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Build dynamic query conditions for performance
    v_query := 'SELECT s.* FROM public.startups s WHERE 1=1';
    
    -- Add filter conditions
    IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
      v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
    END IF;
    
    IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
      v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
    END IF;
    
    IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
      v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
    END IF;
    
    IF p_team_size IS NOT NULL THEN
      v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
    END IF;
    
    IF p_funding_round IS NOT NULL THEN
      v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
    END IF;
    
    -- Add conditions to query if any filters were applied
    IF array_length(v_conditions, 1) > 0 THEN
      v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
    END IF;
    
    -- Exclude startups that user has already liked or passed
    v_query := v_query || format(' AND NOT EXISTS (
      SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
    ) AND NOT EXISTS (
      SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
    )', v_user_id, v_user_id);
    
    -- Add ordering and pagination
    v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
    
    -- Execute the query securely
    RETURN QUERY EXECUTE v_query;
  END;
  $$;

  -- Grant execute permission to authenticated users
  GRANT EXECUTE ON FUNCTION public.get_startups_paginated TO authenticated;

  -- ============================================
  -- FUNCTION TO GET STARTUP COUNT (for hasMore)
  -- ============================================
  
  CREATE OR REPLACE FUNCTION public.get_startups_count(
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
  )
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_user_id uuid := auth.uid();
    v_query text;
    v_conditions text[] := ARRAY[]::text[];
    v_count integer;
  BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
      RETURN 0;
    END IF;

    -- Build dynamic query conditions
    v_query := 'SELECT COUNT(*)::integer FROM public.startups s WHERE 1=1';
    
    -- Add filter conditions (same logic as get_startups_paginated)
    IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
      v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
    END IF;
    
    IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
      v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
    END IF;
    
    IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
      v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
    END IF;
    
    IF p_team_size IS NOT NULL THEN
      v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
    END IF;
    
    IF p_funding_round IS NOT NULL THEN
      v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
    END IF;
    
    -- Add conditions to query if any filters were applied
    IF array_length(v_conditions, 1) > 0 THEN
      v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
    END IF;
    
    -- Exclude startups that user has already liked or passed
    v_query := v_query || format(' AND NOT EXISTS (
      SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
    ) AND NOT EXISTS (
      SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
    )', v_user_id, v_user_id);
    
    -- Execute the query securely
    EXECUTE v_query INTO v_count;
    
    RETURN COALESCE(v_count, 0);
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.get_startups_count TO authenticated;

  -- ============================================
  -- LIGHTWEIGHT FUNCTION FOR STARTUP LISTING
  -- ============================================
  
  -- Function to get only essential fields for faster loading
  CREATE OR REPLACE FUNCTION public.get_startups_lightweight(
    p_limit integer DEFAULT 5,
    p_offset integer DEFAULT 0,
    p_industry text[] DEFAULT NULL,
    p_stage text[] DEFAULT NULL,
    p_location text[] DEFAULT NULL,
    p_team_size text DEFAULT NULL,
    p_funding_round text DEFAULT NULL
  )
  RETURNS TABLE (
    id uuid,
    name text,
    description text,
    industry text,
    stage text,
    funding_round text,
    team_size text,
    location text,
    gradient text,
    logo text,
    created_at timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_user_id uuid := auth.uid();
    v_query text;
    v_conditions text[] := ARRAY[]::text[];
  BEGIN
    -- Security: Only allow authenticated users
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Build optimized query with only essential fields
    v_query := 'SELECT s.id, s.name, s.description, s.industry, s.stage, s.funding_round, 
                       s.team_size, s.location, s.gradient, s.logo, s.created_at 
                FROM public.startups s WHERE 1=1';
    
    -- Add filter conditions (same as main function but for lightweight version)
    IF p_industry IS NOT NULL AND array_length(p_industry, 1) > 0 THEN
      v_conditions := v_conditions || format('s.industry = ANY(%L)', p_industry);
    END IF;
    
    IF p_stage IS NOT NULL AND array_length(p_stage, 1) > 0 THEN
      v_conditions := v_conditions || format('s.stage = ANY(%L)', p_stage);
    END IF;
    
    IF p_location IS NOT NULL AND array_length(p_location, 1) > 0 THEN
      v_conditions := v_conditions || format('s.location = ANY(%L)', p_location);
    END IF;
    
    IF p_team_size IS NOT NULL THEN
      v_conditions := v_conditions || format('s.team_size = %L', p_team_size);
    END IF;
    
    IF p_funding_round IS NOT NULL THEN
      v_conditions := v_conditions || format('s.funding_round = %L', p_funding_round);
    END IF;
    
    -- Add conditions to query if any filters were applied
    IF array_length(v_conditions, 1) > 0 THEN
      v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
    END IF;
    
    -- Exclude startups that user has already liked or passed
    v_query := v_query || format(' AND NOT EXISTS (
      SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
    ) AND NOT EXISTS (
      SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
    )', v_user_id, v_user_id);
    
    -- Add ordering and pagination
    v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
    
    -- Execute the query securely
    RETURN QUERY EXECUTE v_query;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.get_startups_lightweight TO authenticated;


