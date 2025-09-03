import { supabase } from './supabaseClient.js'

export const notificationService = {
    // Get all user notifications
    async getUserNotifications(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching notifications:', error)
            return []
        }
    },

    // Get unread notifications
    async getUnreadNotifications(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('read', false)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching unread notifications:', error)
            return []
        }
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error marking notification as read:', error)
            throw error
        }
    },

    // Mark all notifications as read
    async markAllAsRead(userId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
            throw error
        }
    },

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting notification:', error)
            throw error
        }
    },

    // Create notification
    async createNotification(notificationData) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([notificationData])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating notification:', error)
            throw error
        }
    },

    // Get unread notifications count
    async getUnreadCount(userId) {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false)

            if (error) throw error
            return count || 0
        } catch (error) {
            console.error('Error getting unread count:', error)
            return 0
        }
    },

    // Subscribe to real-time notifications
    subscribeToNotifications(userId, callback) {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe()
    }
}
