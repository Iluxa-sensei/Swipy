import { supabase } from './supabaseClient.js'
import { notificationService } from './notificationService.js'

export const swipeService = {
    // Like startup
    async likeStartup(userId, startupId) {
        try {
            // First remove pass if it exists
            await supabase
                .from('passes')
                .delete()
                .eq('user_id', userId)
                .eq('startup_id', startupId)

            // Check if like already exists
            const { data: existingLike } = await supabase
                .from('likes')
                .select('id')
                .eq('user_id', userId)
                .eq('startup_id', startupId)
                .single()

            if (existingLike) {
                // Like already exists, return it
                console.log('Like already exists, returning existing like')
                return existingLike
            }

            // Get startup info to get owner_id
            const { data: startup, error: startupError } = await supabase
                .from('startups')
                .select('id, owner_id, name')
                .eq('id', startupId)
                .single()

            if (startupError) {
                console.error('Error fetching startup:', startupError)
            }

            // Add like using upsert to handle race conditions
            const { data, error } = await supabase
                .from('likes')
                .upsert([{
                    user_id: userId,
                    startup_id: startupId
                }], {
                    onConflict: 'user_id,startup_id'
                })
                .select()
                .single()

            // If error is duplicate key, it means like already exists (race condition)
            // In this case, fetch and return the existing like
            if (error) {
                if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
                    console.log('Duplicate key error (race condition), fetching existing like')
                    const { data: existingLikeAfterError } = await supabase
                        .from('likes')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('startup_id', startupId)
                        .single()

                    if (existingLikeAfterError) {
                        return existingLikeAfterError
                    }
                }
                throw error
            }

            // Create notification for startup owner if owner exists and is not the same as liker
            if (startup?.owner_id && startup.owner_id !== userId) {
                try {
                    // Get liker's profile info for notification
                    const { data: likerProfile } = await supabase
                        .from('profiles')
                        .select('full_name, username')
                        .eq('id', userId)
                        .single()

                    const likerName = likerProfile?.full_name || likerProfile?.username || 'Someone'

                    await notificationService.createNotification({
                        user_id: startup.owner_id,
                        type: 'like',
                        title: 'New Like',
                        message: `${likerName} liked your startup "${startup.name}"`,
                        data: {
                            startup_id: startupId,
                            startup_name: startup.name,
                            liker_id: userId,
                            liker_name: likerName
                        },
                        read: false
                    })
                } catch (notifError) {
                    console.error('Error creating notification:', notifError)
                    // Don't throw - notification failure shouldn't break the like
                }
            }

            return data
        } catch (error) {
            console.error('Error liking startup:', error)
            throw error
        }
    },

    // Pass startup
    async passStartup(userId, startupId) {
        try {
            // First remove like if it exists
            await supabase
                .from('likes')
                .delete()
                .eq('user_id', userId)
                .eq('startup_id', startupId)

            // Add pass
            const { data, error } = await supabase
                .from('passes')
                .insert([{
                    user_id: userId,
                    startup_id: startupId
                }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error passing startup:', error)
            throw error
        }
    },

    // Get user likes
    async getUserLikes(userId) {
        try {
            console.log('swipeService.getUserLikes: Fetching likes for user:', userId)

            const { data, error } = await supabase
                .from('likes')
                .select(`
          *,
          startups (
            id,
            owner_id,
            slug,
            name,
            description,
            website,
            logo_url,
            logo,
            industry,
            category,
            stage,
            funding_round,
            funding,
            team_size,
            location,
            gradient,
            investment_required,
            investment_percentage,
            ebitda,
            image,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('swipeService.getUserLikes: Supabase error:', error)
                throw error
            }

            console.log('swipeService.getUserLikes: Received data:', data)
            return data || []
        } catch (error) {
            console.error('swipeService.getUserLikes: Error fetching user likes:', error)
            return []
        }
    },

    // Get user passes
    async getUserPasses(userId) {
        try {
            console.log('swipeService.getUserPasses: Fetching passes for user:', userId)

            const { data, error } = await supabase
                .from('passes')
                .select(`
          *,
          startups (
            id,
            owner_id,
            slug,
            name,
            description,
            website,
            logo_url,
            logo,
            industry,
            category,
            stage,
            funding_round,
            funding,
            team_size,
            location,
            gradient,
            investment_required,
            investment_percentage,
            ebitda,
            image,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('swipeService.getUserPasses: Supabase error:', error)
                throw error
            }

            console.log('swipeService.getUserPasses: Received data:', data)
            return data || []
        } catch (error) {
            console.error('swipeService.getUserPasses: Error fetching user passes:', error)
            return []
        }
    },

    // Check swipe status
    async getSwipeStatus(userId, startupId) {
        try {
            // Check like
            const { data: likeData } = await supabase
                .from('likes')
                .select('id')
                .eq('user_id', userId)
                .eq('startup_id', startupId)
                .single()

            if (likeData) return 'liked'

            // Check pass
            const { data: passData } = await supabase
                .from('passes')
                .select('id')
                .eq('user_id', userId)
                .eq('startup_id', startupId)
                .single()

            if (passData) return 'passed'

            return 'none'
        } catch (error) {
            console.error('Error checking swipe status:', error)
            return 'none'
        }
    },

    // Remove swipe
    async removeSwipe(userId, startupId) {
        try {
            // Remove both like and pass
            await Promise.all([
                supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('startup_id', startupId),
                supabase
                    .from('passes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('startup_id', startupId)
            ])

            return true
        } catch (error) {
            console.error('Error removing swipe:', error)
            throw error
        }
    }
}
