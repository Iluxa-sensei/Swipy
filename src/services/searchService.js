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
  owner_id,
  description
`

export const searchService = {
    async searchProfiles(query, limit = 8) {
        if (!query || !query.trim()) {
            console.log('searchProfiles: empty query')
            return []
        }

        try {
            const normalized = query.trim().toLowerCase()
            console.log('searchProfiles: searching for', normalized)

            // Get all matching profiles
            const { data, error } = await supabase
                .from('profiles')
                .select(PROFILE_FIELDS)
                .or(`username.ilike.%${normalized}%,full_name.ilike.%${normalized}%`)
                .limit(limit * 2) // Get more to filter and rank

            if (error) {
                console.error('searchProfiles error:', error)
                throw error
            }

            if (!data || data.length === 0) {
                return []
            }

            // Rank results by relevance
            const ranked = data.map(profile => {
                const username = (profile.username || '').toLowerCase()
                const fullName = (profile.full_name || '').toLowerCase()
                let score = 0

                // Exact match gets highest score
                if (username === normalized || fullName === normalized) {
                    score = 1000
                }
                // Starts with query gets high score
                else if (username.startsWith(normalized) || fullName.startsWith(normalized)) {
                    score = 500
                }
                // Contains query gets lower score
                else if (username.includes(normalized) || fullName.includes(normalized)) {
                    score = 100
                }
                // Word boundary match (starts with query as a word)
                else {
                    const usernameWords = username.split(/\s+/)
                    const fullNameWords = fullName.split(/\s+/)
                    if (usernameWords.some(word => word.startsWith(normalized)) || 
                        fullNameWords.some(word => word.startsWith(normalized))) {
                        score = 300
                    } else {
                        score = 50
                    }
                }

                return { profile, score }
            })

            // Sort by score (highest first), then by date
            ranked.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score
                }
                const dateA = new Date(a.profile.updated_at || a.profile.created_at || 0)
                const dateB = new Date(b.profile.updated_at || b.profile.created_at || 0)
                return dateB - dateA
            })

            // Filter out low relevance results (score < 50) and limit
            const filtered = ranked
                .filter(item => item.score >= 50)
                .slice(0, limit)
                .map(item => item.profile)

            console.log('searchProfiles: found', filtered.length, 'profiles')
            return filtered
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
            const normalized = query.trim().toLowerCase()
            console.log('searchStartups: searching for', normalized)

            // Get all matching startups
            const { data, error } = await supabase
                .from('startups')
                .select(STARTUP_FIELDS)
                .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%,industry.ilike.%${normalized}%`)
                .limit(limit * 2) // Get more to filter and rank

            if (error) {
                console.error('searchStartups error:', error)
                throw error
            }

            if (!data || data.length === 0) {
                return []
            }

            // Rank results by relevance
            const ranked = data.map(startup => {
                const name = (startup.name || '').toLowerCase()
                const description = (startup.description || '').toLowerCase()
                const industry = (startup.industry || '').toLowerCase()
                let score = 0

                // Exact match in name gets highest score
                if (name === normalized) {
                    score = 1000
                }
                // Name starts with query gets high score
                else if (name.startsWith(normalized)) {
                    score = 500
                }
                // Name contains query gets medium score
                else if (name.includes(normalized)) {
                    score = 200
                }
                // Word boundary match in name
                else {
                    const nameWords = name.split(/\s+/)
                    if (nameWords.some(word => word.startsWith(normalized))) {
                        score = 300
                    }
                    // Description or industry contains query gets lower score
                    else if (description.includes(normalized) || industry.includes(normalized)) {
                        score = 100
                    } else {
                        score = 50
                    }
                }

                return { startup, score }
            })

            // Sort by score (highest first), then by date
            ranked.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score
                }
                const dateA = new Date(a.startup.created_at || 0)
                const dateB = new Date(b.startup.created_at || 0)
                return dateB - dateA
            })

            // Filter out low relevance results (score < 50) and limit
            const filtered = ranked
                .filter(item => item.score >= 50)
                .slice(0, limit)
                .map(item => item.startup)

            console.log('searchStartups: found', filtered.length, 'startups')
            return filtered
        } catch (error) {
            console.error('searchService.searchStartups error', error)
            return []
        }
    }
}

