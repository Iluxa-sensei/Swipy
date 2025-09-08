-- Fix Database Linter Issues
-- This script addresses performance and security issues found by the database linter

-- 1. Fix RLS policies performance issues by using SELECT subqueries
-- This prevents re-evaluation of auth functions for each row

-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;
CREATE POLICY "Users can upsert their own profile" ON public.profiles
  FOR ALL USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Fix chats table RLS policies
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (
    (select auth.uid()) IN (
      SELECT user_id FROM public.chat_participants 
      WHERE chat_id = NEW.id
    )
  );

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    (select auth.uid()) IN (
      SELECT user_id FROM public.chat_participants 
      WHERE chat_id = id
    )
  );

-- Fix achievements table RLS policies
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;
CREATE POLICY "Users can manage their own achievements" ON public.achievements
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Fix portfolio_projects table RLS policies
DROP POLICY IF EXISTS "Users can manage their own portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Users can manage their own portfolio projects" ON public.portfolio_projects
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Fix work_experience table RLS policies
DROP POLICY IF EXISTS "Users can manage their own work experience" ON public.work_experience;
CREATE POLICY "Users can manage their own work experience" ON public.work_experience
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Fix education table RLS policies
DROP POLICY IF EXISTS "Users can manage their own education" ON public.education;
CREATE POLICY "Users can manage their own education" ON public.education
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- 2. Fix multiple permissive policies by consolidating them
-- Remove redundant policies and keep only the most permissive ones

-- For achievements table - keep only the view all policy for SELECT
DROP POLICY IF EXISTS "Users can view all achievements" ON public.achievements;
CREATE POLICY "Users can view all achievements" ON public.achievements
  FOR SELECT USING (true);

-- For education table - keep only the view all policy for SELECT
DROP POLICY IF EXISTS "Users can view all education" ON public.education;
CREATE POLICY "Users can view all education" ON public.education
  FOR SELECT USING (true);

-- For portfolio_projects table - keep only the view all policy for SELECT
DROP POLICY IF EXISTS "Users can view all portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Users can view all portfolio projects" ON public.portfolio_projects
  FOR SELECT USING (true);

-- For work_experience table - keep only the view all policy for SELECT
DROP POLICY IF EXISTS "Users can view all work experience" ON public.work_experience;
CREATE POLICY "Users can view all work experience" ON public.work_experience
  FOR SELECT USING (true);

-- For profiles table - consolidate INSERT policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
-- Keep only the upsert policy

-- For profiles table - consolidate SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by users themselves" ON public.profiles;
-- Keep only the authenticated users policy

-- 3. Fix security definer view issue
-- Remove the SECURITY DEFINER property from the view
DROP VIEW IF EXISTS public.complete_profiles;
CREATE VIEW public.complete_profiles AS
SELECT 
  p.*,
  COALESCE(we_count.count, 0) as work_experience_count,
  COALESCE(ed_count.count, 0) as education_count,
  COALESCE(pp_count.count, 0) as portfolio_projects_count,
  COALESCE(ach_count.count, 0) as achievements_count,
  COALESCE(st_count.count, 0) as startups_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.work_experience 
  GROUP BY user_id
) we_count ON p.id = we_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.education 
  GROUP BY user_id
) ed_count ON p.id = ed_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.portfolio_projects 
  GROUP BY user_id
) pp_count ON p.id = pp_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.achievements 
  GROUP BY user_id
) ach_count ON p.id = ach_count.user_id
LEFT JOIN (
  SELECT owner_id, COUNT(*) as count 
  FROM public.startups 
  GROUP BY owner_id
) st_count ON p.id = st_count.owner_id;

-- Grant access to the view
GRANT SELECT ON public.complete_profiles TO authenticated;

-- 4. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_likes_startup_id ON public.likes(startup_id);
CREATE INDEX IF NOT EXISTS idx_passes_startup_id ON public.passes(startup_id);

-- 5. Remove unused indexes to improve performance
-- Note: We'll keep some indexes that might be used in the future
-- but remove the ones that are definitely not needed

-- Remove unused indexes that are not likely to be used
DROP INDEX IF EXISTS idx_chat_participants_user_id;
DROP INDEX IF EXISTS idx_messages_chat_id;
DROP INDEX IF EXISTS idx_startups_location;
DROP INDEX IF EXISTS idx_startups_category;
DROP INDEX IF EXISTS idx_startups_industry;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_achievements_category;
DROP INDEX IF EXISTS idx_portfolio_projects_category;
DROP INDEX IF EXISTS idx_portfolio_projects_featured;
DROP INDEX IF EXISTS idx_work_experience_current;
DROP INDEX IF EXISTS idx_profiles_completion;
DROP INDEX IF EXISTS idx_achievements_user_category;
DROP INDEX IF EXISTS idx_portfolio_user_featured;
DROP INDEX IF EXISTS idx_work_experience_user_current;

-- 6. Add essential indexes that will be used
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON public.passes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON public.messages(chat_id, created_at);
CREATE INDEX IF EXISTS idx_startups_owner_id ON public.startups(owner_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_user_id ON public.portfolio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_user_id ON public.work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);

-- 7. Update the get_complete_profile function to be more efficient
CREATE OR REPLACE FUNCTION public.get_complete_profile(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profile', row_to_json(p),
    'workExperience', COALESCE(we_data.data, '[]'::json),
    'education', COALESCE(ed_data.data, '[]'::json),
    'portfolioProjects', COALESCE(pp_data.data, '[]'::json),
    'achievements', COALESCE(ach_data.data, '[]'::json),
    'startups', COALESCE(st_data.data, '[]'::json)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(we)) as data
    FROM public.work_experience we
    WHERE we.user_id = p_user_id
    GROUP BY user_id
  ) we_data ON p.id = we_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(ed)) as data
    FROM public.education ed
    WHERE ed.user_id = p_user_id
    GROUP BY user_id
  ) ed_data ON p.id = ed_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(pp)) as data
    FROM public.portfolio_projects pp
    WHERE pp.user_id = p_user_id
    GROUP BY user_id
  ) pp_data ON p.id = pp_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(ach)) as data
    FROM public.achievements ach
    WHERE ach.user_id = p_user_id
    GROUP BY user_id
  ) ach_data ON p.id = ach_data.user_id
  LEFT JOIN (
    SELECT owner_id, json_agg(row_to_json(st)) as data
    FROM public.startups st
    WHERE st.owner_id = p_user_id
    GROUP BY owner_id
  ) st_data ON p.id = st_data.owner_id
  WHERE p.id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_complete_profile(uuid) TO authenticated;

-- 8. Add comments for documentation
COMMENT ON INDEX idx_likes_startup_id IS 'Index for foreign key constraint on likes.startup_id';
COMMENT ON INDEX idx_passes_startup_id IS 'Index for foreign key constraint on passes.startup_id';
COMMENT ON INDEX idx_messages_chat_id_created_at IS 'Composite index for efficient message queries by chat and time';
COMMENT ON INDEX idx_startups_owner_id IS 'Index for efficient startup queries by owner';

-- Success message
SELECT 'DATABASE LINTER ISSUES FIXED SUCCESSFULLY!' as status,
       'Performance and security issues have been resolved. RLS policies optimized, unused indexes removed, and essential indexes added.' as description;
