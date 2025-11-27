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
            return []
        }

        try {
            const normalized = query.trim()
            const { data, error } = await supabase
                .from('profiles')
                .select(PROFILE_FIELDS)
                .or(`username.ilike.%${normalized}%,full_name.ilike.%${normalized}%`)
                .order('updated_at', { ascending: false })
                .limit(limit)

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('searchService.searchProfiles error', error)
            return []
        }
    },

    async searchStartups(query, limit = 8) {
        if (!query || !query.trim()) {
            return []
        }

        try {
            const normalized = query.trim()
            const { data, error } = await supabase
                .from('startups')
                .select(STARTUP_FIELDS)
                .ilike('name', `%${normalized}%`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('searchService.searchStartups error', error)
            return []
        }
    }
}

