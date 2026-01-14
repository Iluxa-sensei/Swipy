import { supabase } from './supabaseClient.js'

export const chatService = {
    // Get all user chats using RPC (bypasses RLS, faster and more reliable)
    async getUserChats(userId) {
        try {
            console.log('Fetching chats for user:', userId)

            // Use RPC function to get basic chat list
            const { data: userChats, error: chatsError } = await supabase
                .rpc('get_user_chats_simple', { p_user_id: userId })

            if (chatsError) {
                console.error('Error fetching chats via RPC:', chatsError)
                throw chatsError
            }

            if (!userChats || userChats.length === 0) {
                console.log('No chats found for user')
                return []
            }

            console.log('Found', userChats.length, 'chats')

            // Get chat IDs
            const chatIds = userChats.map(c => c.chat_id)

            // Get last messages for all chats using RPC
            const messagesPromises = chatIds.map(chatId =>
                supabase.rpc('get_chat_messages_simple', { p_chat_id: chatId })
            )

            const messagesResults = await Promise.all(messagesPromises)

            // Build last message map
            const latestMessages = {}
            messagesResults.forEach((result, index) => {
                const chatId = chatIds[index]
                if (result.data && result.data.length > 0) {
                    // Get the last message
                    const messages = result.data
                    latestMessages[chatId] = messages[messages.length - 1]
                }
            })

            // Get startup info for startup chats
            const startupIds = userChats
                .filter(c => c.context_startup_id)
                .map(c => c.context_startup_id)

            let startups = []
            if (startupIds.length > 0) {
                const { data: startupsData, error: startupsError } = await supabase
                    .from('startups')
                    .select('id, name, logo_url, logo, gradient, owner_id, slug, profiles!startups_owner_id_fkey(username)')
                    .in('id', startupIds)

                if (!startupsError && startupsData) {
                    startups = startupsData
                }
            }

            const startupMap = {}
            startups.forEach(s => {
                startupMap[s.id] = s
            })

            // Get other participants info
            const otherUserIds = userChats
                .filter(c => c.other_user_id)
                .map(c => c.other_user_id)
                .filter(id => id) // Remove nulls

            let otherUsers = []
            if (otherUserIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .in('id', otherUserIds)

                if (!usersError && usersData) {
                    otherUsers = usersData
                }
            }

            const userMap = {}
            otherUsers.forEach(u => {
                userMap[u.id] = u
            })

            // Build result
            const result = userChats.map(chat => {
                const lastMessage = latestMessages[chat.chat_id]
                const unreadCount = 0 // TODO: implement unread counting if needed

                if (chat.context_startup_id) {
                    // Startup chat
                    const startup = startupMap[chat.context_startup_id]
                    return {
                        chat_id: chat.chat_id,
                        startup_id: startup?.id || null,
                        startup_name: startup?.name || 'Unknown Startup',
                        startup_logo: startup?.logo_url || startup?.logo || null,
                        startup_gradient: startup?.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700',
                        startup_slug: startup?.slug || null,
                        last_message_body: lastMessage?.body || null,
                        last_message_at: lastMessage?.created_at || chat.created_at,
                        last_message_sender_id: lastMessage?.sender_id || null,
                        unread_count: unreadCount,
                        chat_type: 'startup',
                        other_participant: userMap[chat.other_user_id] || null
                    }
                } else {
                    // User chat
                    const otherUser = userMap[chat.other_user_id]
                    return {
                        chat_id: chat.chat_id,
                        startup_id: null,
                        startup_name: null,
                        startup_logo: null,
                        startup_gradient: null,
                        startup_slug: null,
                        last_message_body: lastMessage?.body || null,
                        last_message_at: lastMessage?.created_at || chat.created_at,
                        last_message_sender_id: lastMessage?.sender_id || null,
                        unread_count: unreadCount,
                        chat_type: 'user',
                        other_participant_id: chat.other_user_id,
                        other_participant_name: otherUser?.full_name || otherUser?.username || 'Unknown User',
                        other_participant_avatar: otherUser?.avatar_url || null,
                        other_participant: otherUser || null
                    }
                }
            })

            // Sort by last message time
            result.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
                return timeB - timeA
            })

            console.log('Processed', result.length, 'chats')
            return result
        } catch (error) {
            console.error('Error fetching user chats:', error)
            return []
        }
    },

    // Create or get chat for a specific startup (server figures out participants)
    async getOrCreateStartupChat(startupId) {
        try {
            const { data, error } = await supabase
                .rpc('start_or_get_chat', { p_startup_id: startupId })

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating/getting startup chat:', error)
            throw error
        }
    },

    // Create or get chat with a user (direct message)
    // Uses RPC function with security definer to avoid RLS recursion issues
    async getOrCreateUserChat(currentUserId, targetUserId) {
        try {
            if (!currentUserId || !targetUserId) {
                throw new Error('User IDs are required')
            }

            if (currentUserId === targetUserId) {
                throw new Error('Cannot create chat with yourself')
            }

            // Use RPC function to avoid RLS policy recursion
            const { data: chatId, error: rpcError } = await supabase
                .rpc('get_or_create_user_chat', { p_target_user_id: targetUserId })

            if (rpcError) {
                console.error('Error in get_or_create_user_chat RPC:', rpcError)
                throw new Error(`Failed to create chat: ${rpcError.message}`)
            }

            if (!chatId) {
                throw new Error('Chat ID was not returned from RPC function')
            }

            return chatId
        } catch (error) {
            console.error('Error creating/getting user chat:', error)
            throw error
        }
    },

    // Create new chat (legacy method)
    async createChat(participantIds, startupId = null) {
        try {
            // Create chat
            const chatData = startupId ? { startup_id: startupId } : {}
            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .insert([chatData])
                .select()
                .single()

            if (chatError) throw chatError

            // Add participants
            const participants = participantIds.map(userId => ({
                chat_id: chat.id,
                user_id: userId
            }))

            const { error: participantsError } = await supabase
                .from('chat_participants')
                .insert(participants)

            if (participantsError) throw participantsError

            return chat
        } catch (error) {
            console.error('Error creating chat:', error)
            throw error
        }
    },

    // Get chat messages using RPC (faster, bypasses RLS)
    async getChatMessages(chatId) {
        try {
            console.log('Fetching messages for chat:', chatId)

            // Use RPC function to bypass RLS
            const { data: messages, error } = await supabase
                .rpc('get_chat_messages_simple', { p_chat_id: chatId })

            if (error) {
                console.error('Error fetching messages via RPC:', error)
                throw error
            }

            // If no messages, return empty array
            if (!messages || messages.length === 0) {
                return []
            }

            // Get unique sender IDs
            const senderIds = [...new Set(messages.map(m => m.sender_id))]

            // Get profiles for all senders
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, username')
                .in('id', senderIds)

            if (profilesError) {
                console.warn('Error fetching profiles for messages:', profilesError)
            }

            // Create a map of sender_id -> profile
            const profileMap = {}
            if (profiles) {
                profiles.forEach(profile => {
                    profileMap[profile.id] = profile
                })
            }

            // Attach profile data to each message
            const messagesWithProfiles = messages.map(message => ({
                ...message,
                profiles: profileMap[message.sender_id] || null
            }))

            console.log('Messages fetched:', messagesWithProfiles.length)
            return messagesWithProfiles || []
        } catch (error) {
            console.error('Error fetching chat messages:', error)
            return []
        }
    },

    // Send message using RPC (bypasses RLS, faster and more reliable)
    async sendMessage(chatId, senderId, body) {
        try {
            if (!chatId || !senderId || !body || !body.trim()) {
                throw new Error('Chat ID, sender ID, and message body are required')
            }

            console.log('Sending message to chat:', chatId, 'from user:', senderId)

            // Use RPC function to bypass RLS
            const { data: messageId, error } = await supabase
                .rpc('send_message_simple', {
                    p_chat_id: chatId,
                    p_body: body.trim()
                })

            if (error) {
                console.error('Error sending message via RPC:', error)
                throw new Error(error.message || 'Failed to send message')
            }

            if (!messageId) {
                throw new Error('Message was not created - no ID returned')
            }

            console.log('Message sent successfully:', messageId)

            // Return message object with the ID
            return {
                id: messageId,
                chat_id: chatId,
                sender_id: senderId,
                body: body.trim(),
                created_at: new Date().toISOString()
            }
        } catch (error) {
            console.error('Error sending message:', error)
            throw error
        }
    },

    // Subscribe to new messages in a specific chat (realtime)
    subscribeToMessages(chatId, callback) {
        console.log('Creating realtime subscription for chat:', chatId)
        
        const channel = supabase
            .channel(`chat-messages:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    console.log('Realtime INSERT received for chat:', chatId, payload)
                    callback({
                        eventType: 'INSERT',
                        new: payload.new
                    })
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status for chat', chatId, ':', status)
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to chat:', chatId)
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to chat:', chatId)
                }
            })

        return channel
    },

    // Subscribe to any new messages for the current user (used to refresh chat list in realtime)
    subscribeToUserMessages(userId, callback) {
        if (!userId) return null

        console.log('Creating user-level realtime subscription for user:', userId)

        const channel = supabase
            .channel(`user-all-messages:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                    // Note: All message inserts will be received, but RLS on the database
                    // determines what data is actually accessible
                },
                (payload) => {
                    console.log('Realtime INSERT received for user:', userId, payload)
                    callback({
                        eventType: 'INSERT',
                        new: payload.new
                    })
                }
            )
            .subscribe((status) => {
                console.log('User realtime subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to user messages:', userId)
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to user messages:', userId)
                }
            })

        return channel
    },

    // Get chat info with startup details or user info
    async getChatInfo(chatId) {
        try {
            console.log('Fetching chat info for chatId:', chatId)

            // Validate that chatId is a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(chatId)) {
                console.error('Invalid chatId format (not a UUID):', chatId)
                return null
            }

            // First try RPC function (bypasses RLS, more reliable for newly created chats)
            try {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_chat_info_rpc', { p_chat_id: chatId })

                if (!rpcError && rpcData) {
                    console.log('Chat info from RPC:', rpcData)
                    // Convert JSONB to object format
                    const result = {
                        id: rpcData.id,
                        context_startup_id: rpcData.context_startup_id,
                        created_by: rpcData.created_by,
                        created_at: rpcData.created_at,
                        participants: (rpcData.participants || []).map(p => p.user_id),
                        startup: rpcData.startup
                    }
                    console.log('Chat info result from RPC:', result)
                    return result
                } else if (rpcError) {
                    console.warn('RPC function error (will try direct query):', rpcError)
                }
            } catch (rpcErr) {
                console.warn('RPC function not available or failed (will try direct query):', rpcErr)
            }

            // Fallback to direct query (works if RLS policies allow)
            const { data: participants, error: participantsError } = await supabase
                .from('chat_participants')
                .select('user_id, chat_id')
                .eq('chat_id', chatId)

            if (participantsError) {
                console.error('Error fetching participants:', participantsError)
            }

            console.log('Participants fetched:', participants?.map(p => p.user_id))

            // If we got participants, user has access - fetch chat data
            if (participants && participants.length > 0) {
                const { data: chatData, error: chatError } = await supabase
                    .from('chats')
                    .select(`
                        id,
                        context_startup_id,
                        created_by,
                        created_at,
                        startups (
                            id,
                            name,
                            logo_url,
                            logo,
                            gradient,
                            owner_id,
                            slug,
                            profiles!startups_owner_id_fkey(username)
                        )
                    `)
                    .eq('id', chatId)
                    .single()

                if (chatError) {
                    console.error('Error fetching chat:', chatError)
                    // If chat doesn't exist or RLS blocks, return null
                    if (chatError.code === 'PGRST116') {
                        console.warn('Chat not found (PGRST116):', chatId)
                        return null
                    }
                    throw chatError
                }

                if (!chatData) {
                    console.warn('Chat data is null for chatId:', chatId)
                    return null
                }

                console.log('Chat data fetched:', chatData)

                // Build result
                const result = {
                    id: chatData.id,
                    context_startup_id: chatData.context_startup_id,
                    created_by: chatData.created_by,
                    created_at: chatData.created_at,
                    participants: participants?.map(p => p.user_id) || [],
                    startup: chatData.startups || null
                }

                console.log('Chat info result:', result)
                return result
            } else {
                // No participants found - either chat doesn't exist or user doesn't have access
                console.warn('No participants found for chatId:', chatId, '- user may not have access')
                return null
            }
        } catch (error) {
            console.error('Error fetching chat info:', error)
            // Return null instead of throwing to allow retry logic
            return null
        }
    },

    // Mark chat as read
    async markChatAsRead(chatId, userId) {
        try {
            const { error } = await supabase
                .rpc('mark_chat_as_read', {
                    p_chat_id: chatId,
                    p_user_id: userId
                })

            if (error) throw error
        } catch (error) {
            console.error('Error marking chat as read:', error)
            throw error
        }
    },

    // Get chat by nickname and optional startup slug
    async getChatByPrettyParams(currentUserId, nickname, startupSlug = null) {
        try {
            // Remove @ if present
            const cleanNickname = nickname.startsWith('@') ? nickname.substring(1) : nickname

            // 1. Find the target user by nickname
            const { data: targetUser, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', cleanNickname)
                .single()

            if (userError || !targetUser) {
                console.error('Target user not found:', cleanNickname)
                return null
            }

            if (startupSlug) {
                // 2. Find the startup by slug
                // Note: The startup could be owned by the target user or the current user
                const { data: startup, error: startupError } = await supabase
                    .from('startups')
                    .select('id')
                    .eq('slug', startupSlug)
                    .or(`owner_id.eq.${targetUser.id},owner_id.eq.${currentUserId}`)
                    .single()

                if (startupError || !startup) {
                    console.error('Startup not found for slug:', startupSlug)
                    return null
                }

                // 3. Use RPC to get or create the chat for this startup
                return await this.getOrCreateStartupChat(startup.id)
            } else {
                // 2. Use RPC to get or create the direct chat between users
                return await this.getOrCreateUserChat(currentUserId, targetUser.id)
            }
        } catch (error) {
            console.error('Error in getChatByPrettyParams:', error)
            return null
        }
    },

    // Check if chat exists between users
    async getChatBetweenUsers(userId1, userId2) {
        try {
            // Get all chats for userId1
            const { data: user1Chats, error: error1 } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', userId1)

            if (error1) throw error1
            if (!user1Chats || user1Chats.length === 0) return null

            const chatIds = user1Chats.map(c => c.chat_id)

            // Check if userId2 is in any of these chats
            const { data: commonChats, error: error2 } = await supabase
                .from('chat_participants')
                .select(`
          chat_id,
          chats (
            id,
            created_at,
            context_startup_id
          )
        `)
                .eq('user_id', userId2)
                .in('chat_id', chatIds)

            if (error2) throw error2

            // Find a chat that is not a startup chat (context_startup_id is null)
            const directChat = commonChats?.find(chat => !chat.chats?.context_startup_id)

            if (directChat) {
                return {
                    chat_id: directChat.chat_id,
                    chats: directChat.chats
                }
            }

            return null
        } catch (error) {
            console.error('Error checking chat between users:', error)
            return null
        }
    },

    // Get user's startups (for founders to filter chats)
    async getUserStartupsForChats(userId) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .select('id, name, logo_url, logo, gradient')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching user startups for chats:', error)
            return []
        }
    }
}
