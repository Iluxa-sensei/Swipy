-- Test Chat System Functions
-- This script tests if all the chat functions are working correctly

-- Test 1: Check if the functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'get_or_create_startup_chat',
        'get_chat_with_startup', 
        'get_user_chats_with_startups',
        'mark_chat_as_read',
        'update_chat_last_message'
    )
ORDER BY routine_name;

-- Test 2: Check if tables have the new columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('chats', 'chat_participants')
    AND column_name IN ('startup_id', 'title', 'last_message_at', 'last_read_at')
ORDER BY table_name, column_name;

-- Test 3: Check if indexes were created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('chats', 'chat_participants')
    AND indexname LIKE '%startup%' OR indexname LIKE '%last_message%'
ORDER BY tablename, indexname;

-- Test 4: Check if triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND trigger_name IN ('on_message_sent', 'on_auth_user_created')
ORDER BY event_object_table, trigger_name;

-- Test 5: Check sample data
SELECT 
    c.id as chat_id,
    c.startup_id,
    c.title,
    s.name as startup_name,
    COUNT(cp.user_id) as participant_count
FROM public.chats c
LEFT JOIN public.startups s ON c.startup_id = s.id
LEFT JOIN public.chat_participants cp ON c.id = cp.chat_id
GROUP BY c.id, c.startup_id, c.title, s.name
ORDER BY c.created_at DESC;

-- Test 6: Check sample messages
SELECT 
    m.id,
    m.chat_id,
    m.body,
    m.created_at,
    c.startup_id,
    s.name as startup_name
FROM public.messages m
JOIN public.chats c ON m.chat_id = c.id
LEFT JOIN public.startups s ON c.startup_id = s.id
ORDER BY m.created_at DESC
LIMIT 10;
