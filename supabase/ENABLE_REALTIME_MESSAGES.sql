-- Enable Realtime for messages table
-- This allows the Supabase client to subscribe to INSERT/UPDATE/DELETE events
-- Run this in the Supabase SQL Editor

-- Check if messages table is already in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        -- Add the messages table to the realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Messages table added to realtime publication';
    ELSE
        RAISE NOTICE 'Messages table is already in realtime publication';
    END IF;
END $$;

-- Verify the publication includes messages
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- Note: You may also need to enable Realtime in the Supabase Dashboard:
-- 1. Go to Database -> Replication
-- 2. Find the 'supabase_realtime' publication
-- 3. Ensure 'messages' table is included
-- 
-- Or in Table Editor:
-- 1. Select the 'messages' table
-- 2. Click on "Realtime" tab
-- 3. Enable "Enable Realtime"

