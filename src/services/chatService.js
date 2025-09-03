import { supabase } from './supabaseClient.js'

export const chatService = {
    // Get all user chats
    async getUserChats(userId) {
        try {
            const { data, error } = await supabase
                .from('chat_participants')
                .select(`
          chat_id,
          chats (
            id,
            created_at,
            chat_participants!chat_participants_chat_id_fkey (
              user_id,
              profiles!chat_participants_user_id_fkey (
                id,
                full_name,
                avatar_url
              )
            )
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching user chats:', error)
            return []
        }
    },

    // Create new chat
    async createChat(participantIds) {
        try {
            // Create chat
            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .insert([{}])
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

    // Get chat info
    async getChatInfo(chatId) {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
          *,
          chat_participants!chat_participants_chat_id_fkey (
            user_id,
            profiles!chat_participants_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
                .eq('id', chatId)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching chat info:', error)
            return null
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
