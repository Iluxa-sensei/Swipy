-- Optimize Database Performance and Fix RLS Issues
-- Run this in Supabase Dashboard -> SQL Editor

-- ==============================================
-- 1. DROP EXISTING POLICIES (to recreate them optimized)
-- ==============================================

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by users themselves" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Drop existing policies for startups
DROP POLICY IF EXISTS "Startups are readable by authenticated" ON public.startups;
DROP POLICY IF EXISTS "Owners can insert startups" ON public.startups;
DROP POLICY IF EXISTS "Owners can update their startups" ON public.startups;
DROP POLICY IF EXISTS "Owners can delete their startups" ON public.startups;

-- Drop existing policies for likes and passes
DROP POLICY IF EXISTS "Users can manage their likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their passes" ON public.passes;

-- Drop existing policies for chats
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chat participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;

-- Drop existing policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ==============================================
-- 2. CREATE OPTIMIZED RLS POLICIES
-- ==============================================

-- Profiles policies (optimized with SELECT subqueries)
CREATE POLICY "Profiles are viewable by users themselves" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Single policy for authenticated users to view profiles (removes multiple permissive policies)
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- Startups policies (optimized)
CREATE POLICY "Startups are readable by authenticated" ON public.startups
  FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Owners can insert startups" ON public.startups
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Owners can update their startups" ON public.startups
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Owners can delete their startups" ON public.startups
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Likes and passes policies (optimized)
CREATE POLICY "Users can manage their likes" ON public.likes
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their passes" ON public.passes
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Chats policies (optimized)
CREATE POLICY "Users can view their chats" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = id AND cp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view chat participants of their chats" ON public.chat_participants
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read messages in their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.chat_id = chat_id AND cp.user_id = (SELECT auth.uid())
    )
  );

-- Notifications policies (optimized)
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- ==============================================

-- Add indexes for foreign keys that are missing
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Add composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON public.chat_participants(chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_startup ON public.likes(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_passes_user_startup ON public.passes(user_id, startup_id);

-- ==============================================
-- 4. REMOVE UNUSED INDEXES
-- ==============================================

-- Remove unused indexes to improve performance
DROP INDEX IF EXISTS idx_likes_startup_id;
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_onboarding_completed;
DROP INDEX IF EXISTS idx_passes_startup_id;
DROP INDEX IF EXISTS idx_notifications_read;

-- ==============================================
-- 5. ADD SOME SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample startups if none exist
INSERT INTO public.startups (
  id,
  owner_id,
  name,
  description,
  website,
  logo_url,
  industry,
  stage,
  funding_round,
  team_size,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'TechFlow',
  'AI-powered workflow automation platform for enterprise teams',
  'https://techflow.ai',
  null,
  'Technology',
  'Series A',
  'Seed',
  '10-25',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.startups LIMIT 1);

INSERT INTO public.startups (
  id,
  owner_id,
  name,
  description,
  website,
  logo_url,
  industry,
  stage,
  funding_round,
  team_size,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'GreenEnergy',
  'Renewable energy solutions for smart cities',
  'https://greenenergy.com',
  null,
  'Energy',
  'Seed',
  'Pre-seed',
  '5-10',
  now(),
  now()
WHERE (SELECT COUNT(*) FROM public.startups) < 2;

INSERT INTO public.startups (
  id,
  owner_id,
  name,
  description,
  website,
  logo_url,
  industry,
  stage,
  funding_round,
  team_size,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'HealthSync',
  'Digital health platform connecting patients and providers',
  'https://healthsync.io',
  null,
  'Healthcare',
  'Series B',
  'Series A',
  '25-50',
  now(),
  now()
WHERE (SELECT COUNT(*) FROM public.startups) < 3;

-- ==============================================
-- 6. VERIFICATION QUERIES
-- ==============================================

-- Check policies
SELECT 'OPTIMIZED POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'startups', 'likes', 'passes', 'chats', 'messages', 'notifications')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 'INDEXES:' as info;
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'startups', 'likes', 'passes', 'chats', 'messages', 'notifications', 'chat_participants')
ORDER BY tablename, indexname;

-- Check sample data
SELECT 'SAMPLE STARTUPS:' as info;
SELECT id, name, description, industry, stage, created_at FROM public.startups ORDER BY created_at DESC;

-- Check profiles
SELECT 'PROFILES:' as info;
SELECT id, full_name, username, role, onboarding_completed, created_at FROM public.profiles ORDER BY created_at DESC;

-- Success message
SELECT 'DATABASE OPTIMIZATION COMPLETED SUCCESSFULLY!' as status;
