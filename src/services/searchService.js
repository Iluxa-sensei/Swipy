import { supabase } from './supabaseClient.js'

const PROFILE_FIELDS = `
  id,
  username,
  full_name,
  avatar_url,
  role
`

const STARTUP_FIELDS = `
  id,
  name,
  logo,
  logo_url,
  gradient,
  industry,
  stage,
  owner_id
`

export const searchService = {
    async searchProfiles(query, limit = 8) {
        if (!query || !query.trim()) {
            console.log('searchProfiles: empty query')
            return []
        }

        try {
            const normalized = query.trim()
            console.log('searchProfiles: searching for', normalized)

            const { data, error } = await supabase
                .from('profiles')
                .select(PROFILE_FIELDS)
                .or(`username.ilike.%${normalized}%,full_name.ilike.%${normalized}%`)
                .limit(limit)

            // If no updated_at, order by created_at instead
            if (!error && data) {
                data.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at || 0)
                    const dateB = new Date(b.updated_at || b.created_at || 0)
                    return dateB - dateA
                })
            }

            if (error) {
                console.error('searchProfiles error:', error)
                throw error
            }

            console.log('searchProfiles: found', data?.length || 0, 'profiles')
            return data || []
        } catch (error) {
            console.error('searchService.searchProfiles error', error)
            return []
        }
    },

    async searchStartups(query, limit = 8) {
        if (!query || !query.trim()) {
            console.log('searchStartups: empty query')
            return []
        }

        try {
            const normalized = query.trim()
            console.log('searchStartups: searching for', normalized)

            const { data, error } = await supabase
                .from('startups')
                .select(STARTUP_FIELDS)
                .ilike('name', `%${normalized}%`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) {
                console.error('searchStartups error:', error)
                throw error
            }

            console.log('searchStartups: found', data?.length || 0, 'startups')
            return data || []
        } catch (error) {
            console.error('searchService.searchStartups error', error)
            return []
        }
    }
}

