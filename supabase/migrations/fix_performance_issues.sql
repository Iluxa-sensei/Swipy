    -- ============================================================================
    -- Supabase Performance Optimization Migration
    -- ============================================================================
    -- This migration fixes the following performance issues:
    -- 1. auth_rls_initplan: Replace auth.<function>() with (select auth.<function>())
    -- 2. multiple_permissive_policies: Consolidate redundant SELECT policies
    -- 3. duplicate_index: Remove duplicate indexes
    -- ============================================================================

    -- ============================================================================
    -- SECTION 1: Fix RLS Init Plan Issues
    -- Replace auth.<function>() with (select auth.<function>()) in all policies
    -- This prevents re-evaluation of auth functions for each row
    -- ============================================================================

    -- -----------------------------------------------------------------------------
    -- TABLE: profiles
    -- -----------------------------------------------------------------------------

    -- Drop existing policies
    DROP POLICY IF EXISTS "Profiles are viewable by users themselves" ON public.profiles;
    DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

    -- Recreate with optimized auth function calls
    -- Consolidate SELECT policies into one (fixes multiple_permissive_policies)
    CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Users can upsert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = (select auth.uid()));

    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: startups
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Startups are readable by authenticated" ON public.startups;
    DROP POLICY IF EXISTS "Owners can insert startups" ON public.startups;
    DROP POLICY IF EXISTS "Owners can update their startups" ON public.startups;
    DROP POLICY IF EXISTS "Owners can delete their startups" ON public.startups;

    CREATE POLICY "Startups are readable by authenticated"
    ON public.startups FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Owners can insert startups"
    ON public.startups FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = (select auth.uid()));

    CREATE POLICY "Owners can update their startups"
    ON public.startups FOR UPDATE
    TO authenticated
    USING (owner_id = (select auth.uid()))
    WITH CHECK (owner_id = (select auth.uid()));

    CREATE POLICY "Owners can delete their startups"
    ON public.startups FOR DELETE
    TO authenticated
    USING (owner_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: likes
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can manage their likes" ON public.likes;

    CREATE POLICY "Users can manage their likes"
    ON public.likes FOR ALL
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: passes
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can manage their passes" ON public.passes;

    CREATE POLICY "Users can manage their passes"
    ON public.passes FOR ALL
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: notifications
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

    CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

    CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: achievements
    -- -----------------------------------------------------------------------------

    -- Drop existing policies (fixes multiple_permissive_policies)
    DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can view all achievements" ON public.achievements;

    -- Consolidated SELECT policy - all authenticated users can view all achievements
    CREATE POLICY "Achievements are viewable by authenticated users"
    ON public.achievements FOR SELECT
    TO authenticated
    USING (true);

    -- Separate policies for INSERT, UPDATE, DELETE
    CREATE POLICY "Users can insert their own achievements"
    ON public.achievements FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can update their own achievements"
    ON public.achievements FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can delete their own achievements"
    ON public.achievements FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: portfolio_projects
    -- -----------------------------------------------------------------------------

    -- Drop existing policies (fixes multiple_permissive_policies)
    DROP POLICY IF EXISTS "Users can manage their own portfolio projects" ON public.portfolio_projects;
    DROP POLICY IF EXISTS "Users can view all portfolio projects" ON public.portfolio_projects;

    -- Consolidated SELECT policy
    CREATE POLICY "Portfolio projects are viewable by authenticated users"
    ON public.portfolio_projects FOR SELECT
    TO authenticated
    USING (true);

    -- Separate policies for INSERT, UPDATE, DELETE
    CREATE POLICY "Users can insert their own portfolio projects"
    ON public.portfolio_projects FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can update their own portfolio projects"
    ON public.portfolio_projects FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can delete their own portfolio projects"
    ON public.portfolio_projects FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: work_experience
    -- -----------------------------------------------------------------------------

    -- Drop existing policies (fixes multiple_permissive_policies)
    DROP POLICY IF EXISTS "Users can manage their own work experience" ON public.work_experience;
    DROP POLICY IF EXISTS "Users can view all work experience" ON public.work_experience;

    -- Consolidated SELECT policy
    CREATE POLICY "Work experience is viewable by authenticated users"
    ON public.work_experience FOR SELECT
    TO authenticated
    USING (true);

    -- Separate policies for INSERT, UPDATE, DELETE
    CREATE POLICY "Users can insert their own work experience"
    ON public.work_experience FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can update their own work experience"
    ON public.work_experience FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can delete their own work experience"
    ON public.work_experience FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: education
    -- -----------------------------------------------------------------------------

    -- Drop existing policies (fixes multiple_permissive_policies)
    DROP POLICY IF EXISTS "Users can manage their own education" ON public.education;
    DROP POLICY IF EXISTS "Users can view all education" ON public.education;

    -- Consolidated SELECT policy
    CREATE POLICY "Education is viewable by authenticated users"
    ON public.education FOR SELECT
    TO authenticated
    USING (true);

    -- Separate policies for INSERT, UPDATE, DELETE
    CREATE POLICY "Users can insert their own education"
    ON public.education FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can update their own education"
    ON public.education FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

    CREATE POLICY "Users can delete their own education"
    ON public.education FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: chats
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can view chats they created" ON public.chats;
    DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

    CREATE POLICY "Users can view chats they created"
    ON public.chats FOR SELECT
    TO authenticated
    USING (created_by = (select auth.uid()));

    CREATE POLICY "Users can create chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (created_by = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: chat_participants
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can view themselves as participants" ON public.chat_participants;
    DROP POLICY IF EXISTS "Users can add themselves as participants" ON public.chat_participants;

    CREATE POLICY "Users can view themselves as participants"
    ON public.chat_participants FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

    CREATE POLICY "Users can add themselves as participants"
    ON public.chat_participants FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

    -- -----------------------------------------------------------------------------
    -- TABLE: messages
    -- -----------------------------------------------------------------------------

    DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

    -- Users can read messages in chats they participate in
    CREATE POLICY "Users can read messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_id = messages.chat_id
            AND cp.user_id = (select auth.uid())
        )
    );

    -- Users can send messages to chats they participate in
    CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = (select auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_id = messages.chat_id
            AND cp.user_id = (select auth.uid())
        )
    );

    -- ============================================================================
    -- SECTION 2: Remove Duplicate Indexes
    -- ============================================================================

    -- Drop duplicate index on likes table
    -- Keep idx_likes_user_created, drop idx_likes_user_created_desc
    DROP INDEX IF EXISTS public.idx_likes_user_created_desc;

    -- Drop duplicate index on passes table
    -- Keep idx_passes_user_created, drop idx_passes_user_created_desc
    DROP INDEX IF EXISTS public.idx_passes_user_created_desc;

    -- ============================================================================
    -- SECTION 3: Additional Performance Optimizations (Recommended)
    -- ============================================================================

    -- Add indexes for common query patterns if they don't exist

    -- Index for faster profile lookups by username
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

    -- Index for faster startup searches by name
    CREATE INDEX IF NOT EXISTS idx_startups_name ON public.startups(name);

    -- Index for faster startup lookups by owner
    CREATE INDEX IF NOT EXISTS idx_startups_owner_id ON public.startups(owner_id);

-- Index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read) 
WHERE read = false;

    -- Index for messages by chat_id for faster message retrieval
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);

    -- Index for chat_participants for faster participant lookups
    CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);

    -- ============================================================================
    -- VERIFICATION QUERIES (Run these after migration to verify changes)
    -- ============================================================================

    -- To verify RLS policies are using (select auth.uid()):
    -- SELECT schemaname, tablename, policyname, qual, with_check 
    -- FROM pg_policies 
    -- WHERE schemaname = 'public';

    -- To verify indexes:
    -- SELECT tablename, indexname, indexdef 
    -- FROM pg_indexes 
    -- WHERE schemaname = 'public';

    -- ============================================================================
    -- END OF MIGRATION
    -- ============================================================================

