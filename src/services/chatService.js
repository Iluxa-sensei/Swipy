import { supabase } from './supabaseClient.js'

export const chatService = {
    // Get all user chats with startup information
    async getUserChats(userId) {
        try {
            const { data, error } = await supabase
                .rpc('get_user_chats_with_startups', { p_user_id: userId })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching user chats:', error)
            return []
        }
    },

    // Create or get chat for a specific startup
    async getOrCreateStartupChat(startupId, userId) {
        try {
            const { data, error } = await supabase
                .rpc('get_or_create_startup_chat', {
                    p_startup_id: startupId,
                    p_user_id: userId
                })

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating/getting startup chat:', error)
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

    // Get chat messages
    async getChatMessages(chatId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching chat messages:', error)
            return []
        }
    },

    // Send message
    async sendMessage(chatId, senderId, body) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    chat_id: chatId,
                    sender_id: senderId,
                    body
                }])
                .select(`
          *,
          profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error sending message:', error)
            throw error
        }
    },

    // Get chat info with startup details
    async getChatInfo(chatId) {
        try {
            const { data, error } = await supabase
                .rpc('get_chat_with_startup', { p_chat_id: chatId })

            if (error) throw error
            return data?.[0] || null
        } catch (error) {
            console.error('Error fetching chat info:', error)
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

    // Check if chat exists between users
    async getChatBetweenUsers(userId1, userId2) {
        try {
            const { data, error } = await supabase
                .from('chat_participants')
                .select(`
          chat_id,
          chats (
            id,
            created_at
          )
        `)
                .eq('user_id', userId1)
                .in('chat_id',
                    supabase
                        .from('chat_participants')
                        .select('chat_id')
                        .eq('user_id', userId2)
                )

            if (error) throw error
            return data?.[0] || null
        } catch (error) {
            console.error('Error checking chat between users:', error)
            return null
        }
    }
}
