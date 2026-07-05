-- ============================================
-- NICKNAME UNIQUENESS AND URL OPTIMIZATION
-- ============================================

-- 1. Ensure username (nickname) is unique and has valid length
-- First, handle any existing null or duplicate usernames to avoid constraint failure
UPDATE public.profiles 
SET username = 'user_' || substr(id::text, 1, 8) 
WHERE username IS NULL OR username = '';

-- 2. Add unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_unique') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
    END IF;
END $$;

-- 3. Add length check
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_length') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3);
    END IF;
END $$;

-- 4. DROP EXISTING FUNCTIONS TO CHANGE RETURN SIGNATURE
-- This is necessary because CREATE OR REPLACE cannot change the return type
DROP FUNCTION IF EXISTS public.get_startups_paginated(integer,integer,text[],text[],text[],text,text);
DROP FUNCTION IF EXISTS public.get_startups_lightweight_fast(integer,integer,text[],text[],text[],text,text);

-- 5. Update get_startups_paginated to return owner_nickname
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
  owner_nickname text,
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
  updated_at timestamp with time zone,
  likes_count bigint,
  chat_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text;
  v_conditions text[] := ARRAY[]::text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_query := '
    SELECT 
      s.id, s.owner_id, p.username as owner_nickname, s.slug, s.name, s.description, 
      s.website, s.logo_url, s.logo, s.industry, s.category, s.stage, 
      s.funding_round, s.funding, s.team_size, s."teamSize", s.location, 
      s.gradient, s.investment_required, s.investment_percentage, s.ebitda, 
      s.image, s.created_at, s.updated_at,
      s.likes_count,
      s.chat_count
    FROM public.startups s
    LEFT JOIN public.profiles p ON s.owner_id = p.id
    WHERE 1=1';
  
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
  
  IF array_length(v_conditions, 1) > 0 THEN
    v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
  END IF;
  
  v_query := v_query || format(' AND NOT EXISTS (
    SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
  )', v_user_id, v_user_id);
  
  v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
  
  RETURN QUERY EXECUTE v_query;
END;
$$;

-- 6. Update get_startups_lightweight_fast if it exists
CREATE OR REPLACE FUNCTION public.get_startups_lightweight_fast(
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
  created_at timestamp with time zone,
  owner_nickname text,
  slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_query text;
  v_conditions text[] := ARRAY[]::text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_query := 'SELECT s.id, s.name, s.description, s.industry, s.stage, s.funding_round, 
                     s.team_size, s.location, s.gradient, s.logo, s.created_at,
                     p.username as owner_nickname, s.slug
              FROM public.startups s 
              LEFT JOIN public.profiles p ON s.owner_id = p.id
              WHERE 1=1';
  
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
  
  IF array_length(v_conditions, 1) > 0 THEN
    v_query := v_query || ' AND ' || array_to_string(v_conditions, ' AND ');
  END IF;
  
  v_query := v_query || format(' AND NOT EXISTS (
    SELECT 1 FROM public.likes l WHERE l.user_id = %L AND l.startup_id = s.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.passes p WHERE p.user_id = %L AND p.startup_id = s.id
  )', v_user_id, v_user_id);
  
  v_query := v_query || format(' ORDER BY s.created_at DESC LIMIT %s OFFSET %s', p_limit, p_offset);
  
  RETURN QUERY EXECUTE v_query;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_startups_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_startups_lightweight_fast TO authenticated;
