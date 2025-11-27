import { supabase } from './supabaseClient.js'

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

            // Add like
            const { data, error } = await supabase
                .from('likes')
                .insert([{
                    user_id: userId,
                    startup_id: startupId
                }])
                .select()
                .single()

            if (error) throw error
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
