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
  description,
  slug
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
                // Word boundary match (starts with query as a word) - more relevant than contains
                else {
                    const usernameWords = username.split(/\s+/)
                    const fullNameWords = fullName.split(/\s+/)
                    const usernameWordMatch = usernameWords.some(word => word.startsWith(normalized))
                    const fullNameWordMatch = fullNameWords.some(word => word.startsWith(normalized))
                    
                    if (usernameWordMatch || fullNameWordMatch) {
                        score = 300
                    }
                    // Contains query only if it's a meaningful match (not just a substring in the middle of a word)
                    // Check if the query appears at word boundaries or as a complete word
                    else {
                        // Check for word boundary matches where the word is close to the query length
                        // This catches cases like "ai" matching "aino" but not "Tair"
                        const usernameWordBoundary = usernameWords.some(word => {
                            if (!word.includes(normalized)) return false
                            const matchIndex = word.indexOf(normalized)
                            const charsAfter = word.length - matchIndex - normalized.length
                            
                            // For short queries (2 chars), be very strict
                            if (normalized.length <= 2) {
                                // Must be at start, or at end with 0 chars after, or word is query + 1-2 chars
                                return matchIndex === 0 || 
                                       (charsAfter === 0) ||
                                       (matchIndex === 0 && word.length <= normalized.length + 2)
                            }
                            
                            // For longer queries, allow matches near start or end
                            return matchIndex === 0 || 
                                   charsAfter <= 1 ||
                                   (matchIndex === 0 && word.length <= normalized.length + 2)
                        })
                        const fullNameWordBoundary = fullNameWords.some(word => {
                            if (!word.includes(normalized)) return false
                            const matchIndex = word.indexOf(normalized)
                            const charsAfter = word.length - matchIndex - normalized.length
                            
                            // For short queries (2 chars), be very strict
                            if (normalized.length <= 2) {
                                // Must be at start, or at end with 0 chars after, or word is query + 1-2 chars
                                return matchIndex === 0 || 
                                       (charsAfter === 0) ||
                                       (matchIndex === 0 && word.length <= normalized.length + 2)
                            }
                            
                            // For longer queries, allow matches near start or end
                            return matchIndex === 0 || 
                                   charsAfter <= 1 ||
                                   (matchIndex === 0 && word.length <= normalized.length + 2)
                        })
                        
                        if (usernameWordBoundary || fullNameWordBoundary) {
                            score = 150
                        }
                        // Only include if query is at least 3 characters and appears as a significant part
                        else if (normalized.length >= 3 && (username.includes(normalized) || fullName.includes(normalized))) {
                            // Check if it's not just a random substring match
                            const usernameMatch = username.includes(normalized)
                            const fullNameMatch = fullName.includes(normalized)
                            
                            // Only score if the match is meaningful (query is substantial part of the field)
                            if (usernameMatch && (username.length - username.indexOf(normalized) - normalized.length) <= 3) {
                                score = 100
                            } else if (fullNameMatch && (fullName.length - fullName.indexOf(normalized) - normalized.length) <= 3) {
                                score = 100
                            }
                        }
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

            // Filter out low relevance results (score < 100) and limit
            // Only show results with meaningful matches
            const filtered = ranked
                .filter(item => item.score >= 100)
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

            // Get all matching startups (without profiles relation to avoid schema cache error)
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
                // Word boundary match in name (word starts with query)
                else {
                    const nameWords = name.split(/\s+/)
                    const nameWordMatch = nameWords.some(word => word.startsWith(normalized))
                    
                    if (nameWordMatch) {
                        score = 300
                    }
                    // Name contains query - only if it's meaningful
                    else if (name.includes(normalized)) {
                        // Check if match is near the start or end of a word
                        const nameWordsWithMatch = nameWords.filter(word => word.includes(normalized))
                        const meaningfulMatch = nameWordsWithMatch.some(word => {
                            const matchIndex = word.indexOf(normalized)
                            // Match is meaningful if it's at the start, end, or the word is close to query length
                            return matchIndex === 0 || 
                                   (word.length - matchIndex - normalized.length) <= 2 ||
                                   word.length <= normalized.length + 3
                        })
                        
                        if (meaningfulMatch) {
                            score = 200
                        } else if (normalized.length >= 4) {
                            // Only include longer queries as substring matches
                            score = 120
                        }
                    }
                    // Description or industry contains query - only for longer queries
                    else if (normalized.length >= 4 && (description.includes(normalized) || industry.includes(normalized))) {
                        score = 100
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

            // Filter out low relevance results (score < 100) and limit
            // Only show results with meaningful matches
            const filtered = ranked
                .filter(item => item.score >= 100)
                .slice(0, limit)
                .map(item => item.startup)

            // Fetch owner usernames separately if needed
            if (filtered.length > 0) {
                const ownerIds = [...new Set(filtered.map(s => s.owner_id).filter(Boolean))]
                if (ownerIds.length > 0) {
                    const { data: owners, error: ownersError } = await supabase
                        .from('profiles')
                        .select('id, username')
                        .in('id', ownerIds)
                    
                    if (!ownersError && owners) {
                        const ownerMap = {}
                        owners.forEach(o => { ownerMap[o.id] = o.username })
                        // Attach usernames to startups
                        filtered.forEach(s => {
                            if (s.owner_id && ownerMap[s.owner_id]) {
                                s.profiles = { username: ownerMap[s.owner_id] }
                            }
                        })
                    }
                }
            }

            console.log('searchStartups: found', filtered.length, 'startups')
            return filtered
        } catch (error) {
            console.error('searchService.searchStartups error', error)
            return []
        }
    }
}

