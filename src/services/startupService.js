import { supabase } from './supabaseClient.js'

export const startupService = {
    // Get all startups
    async getAllStartups() {
        try {
            console.log('startupService.getAllStartups: Starting to fetch startups...')

            const { data, error } = await supabase
                .from('startups')
                .select(`
          *,
          profiles!startups_owner_id_fkey (
            full_name,
            avatar_url
          )
        `)
                .order('created_at', { ascending: false })

            console.log('startupService.getAllStartups: Supabase response:', { data, error })

            if (error) {
                console.error('startupService.getAllStartups: Supabase error:', error)
                throw error
            }

            console.log('startupService.getAllStartups: Returning data:', data)
            return data || []
        } catch (error) {
            console.error('startupService.getAllStartups: Error:', error)
            return []
        }
    },

    // Get user startups
    async getUserStartups(userId) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching user startups:', error)
            return []
        }
    },

    // Create new startup
    async createStartup(startupData) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .insert([startupData])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating startup:', error)
            throw error
        }
    },

    // Update startup
    async updateStartup(id, updates) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating startup:', error)
            throw error
        }
    },

    // Delete startup
    async deleteStartup(id) {
        try {
            const { error } = await supabase
                .from('startups')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting startup:', error)
            throw error
        }
    },

    // Get startup by ID
    async getStartupById(id) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .select(`
          *,
          profiles!startups_owner_id_fkey (
            full_name,
            avatar_url
          )
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching startup:', error)
            return null
        }
    }
}
