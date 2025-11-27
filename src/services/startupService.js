import { supabase } from './supabaseClient.js'

export const startupService = {
    // Get all startups (keeping for backward compatibility)
    async getAllStartups() {
        try {
            console.log('startupService.getAllStartups: Starting to fetch startups...')

            const { data, error } = await supabase
                .from('startups')
                .select('*')
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
            console.warn('startupService.getAllStartups: Failed to fetch from database, returning empty array')
            return []
        }
    },

    // Validate and sanitize input parameters for security
    _validateAndSanitizeFilters(filters) {
        if (!filters || typeof filters !== 'object') {
            return {}
        }

        const sanitized = {}

        // Validate industries array
        if (Array.isArray(filters.industries) && filters.industries.length > 0) {
            sanitized.industries = filters.industries.filter(item =>
                typeof item === 'string' && item.trim().length > 0 && item.length <= 100
            )
        }

        // Validate stages array  
        if (Array.isArray(filters.stages) && filters.stages.length > 0) {
            sanitized.stages = filters.stages.filter(item =>
                typeof item === 'string' && item.trim().length > 0 && item.length <= 100
            )
        }

        // Validate locations array
        if (Array.isArray(filters.locations) && filters.locations.length > 0) {
            sanitized.locations = filters.locations.filter(item =>
                typeof item === 'string' && item.trim().length > 0 && item.length <= 100
            )
        }

        // Validate team size
        if (typeof filters.teamSize === 'string' && filters.teamSize.trim().length > 0 && filters.teamSize.length <= 50) {
            sanitized.teamSize = filters.teamSize.trim()
        }

        // Validate funding
        if (typeof filters.funding === 'string' && filters.funding.trim().length > 0 && filters.funding.length <= 50) {
            sanitized.funding = filters.funding.trim()
        }

        return sanitized
    },

    // Get startups with pagination for optimized loading using SQL function
    async getStartupsPaginated(offset = 0, limit = 5, filters = {}) {
        try {
            // Validate and sanitize input parameters for security
            const validatedOffset = Math.max(0, parseInt(offset, 10) || 0)
            const validatedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 5), 20) // Max 20 per request
            const sanitizedFilters = this._validateAndSanitizeFilters(filters)

            console.log('startupService.getStartupsPaginated: Starting to fetch startups with pagination...', {
                offset: validatedOffset,
                limit: validatedLimit,
                filters: sanitizedFilters
            })

            // Use optimized SQL function for better performance and security
            const { data, error } = await supabase.rpc('get_startups_paginated', {
                p_limit: validatedLimit,
                p_offset: validatedOffset,
                p_industry: sanitizedFilters.industries && sanitizedFilters.industries.length > 0 ? sanitizedFilters.industries : null,
                p_stage: sanitizedFilters.stages && sanitizedFilters.stages.length > 0 ? sanitizedFilters.stages : null,
                p_location: sanitizedFilters.locations && sanitizedFilters.locations.length > 0 ? sanitizedFilters.locations : null,
                p_team_size: sanitizedFilters.teamSize || null,
                p_funding_round: sanitizedFilters.funding || null
            })

            if (error) {
                console.error('startupService.getStartupsPaginated: Supabase error:', error)

                // Handle specific error types
                if (error.message?.includes('Rate limit exceeded')) {
                    throw new Error('Too many requests. Please wait a moment before trying again.')
                } else if (error.message?.includes('Authentication required')) {
                    throw new Error('Please log in to view startups.')
                } else {
                    throw error
                }
            }

            console.log('startupService.getStartupsPaginated: Received data:', data)

            // Get total count for hasMore calculation (only if needed)
            const hasMore = (data?.length || 0) === validatedLimit

            return {
                data: data || [],
                hasMore,
                total: null // We don't need total count for pagination, just hasMore flag
            }
        } catch (error) {
            console.error('startupService.getStartupsPaginated: Error:', error)

            // Don't fall back to sample data for authentication or rate limit errors
            if (error.message?.includes('Too many requests') ||
                error.message?.includes('Please log in')) {
                throw error
            }

            console.warn('startupService.getStartupsPaginated: Failed to fetch from database, returning empty array')
            // НЕ используем sampleStartups - возвращаем пустой массив
            return {
                data: [],
                hasMore: false,
                total: null
            }
        }
    },

    // Get lightweight startups for faster initial loading
    async getStartupsLightweight(offset = 0, limit = 5, filters = {}) {
        try {
            // Validate and sanitize input parameters for security
            const validatedOffset = Math.max(0, parseInt(offset, 10) || 0)
            const validatedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 5), 20)
            const sanitizedFilters = this._validateAndSanitizeFilters(filters)

            console.log('startupService.getStartupsLightweight: Starting to fetch lightweight startups...', {
                offset: validatedOffset,
                limit: validatedLimit,
                filters: sanitizedFilters
            })

            // Use lightweight SQL function for better performance
            const rpcStartTime = performance.now()
            const { data, error } = await supabase.rpc('get_startups_lightweight_fast', {
                p_limit: validatedLimit,
                p_offset: validatedOffset,
                p_industry: sanitizedFilters.industries && sanitizedFilters.industries.length > 0 ? sanitizedFilters.industries : null,
                p_stage: sanitizedFilters.stages && sanitizedFilters.stages.length > 0 ? sanitizedFilters.stages : null,
                p_location: sanitizedFilters.locations && sanitizedFilters.locations.length > 0 ? sanitizedFilters.locations : null,
                p_team_size: sanitizedFilters.teamSize || null,
                p_funding_round: sanitizedFilters.funding || null
            })
            const rpcEndTime = performance.now()
            console.log(`startupService.getStartupsLightweight: RPC call took ${(rpcEndTime - rpcStartTime).toFixed(2)}ms`)

            if (error) {
                console.error('startupService.getStartupsLightweight: Supabase error:', error)
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })

                if (error.message?.includes('Rate limit exceeded')) {
                    throw new Error('Too many requests. Please wait a moment before trying again.')
                } else if (error.message?.includes('Authentication required')) {
                    throw new Error('Please log in to view startups.')
                } else {
                    throw error
                }
            }

            console.log('startupService.getStartupsLightweight: Received data:', data)
            console.log('startupService.getStartupsLightweight: Data count:', data?.length || 0)

            if (data && data.length > 0) {
                console.log('startupService.getStartupsLightweight: First startup:', {
                    id: data[0].id,
                    name: data[0].name,
                    hasImage: !!data[0].image,
                    hasLogoUrl: !!data[0].logo_url,
                    hasLogo: !!data[0].logo
                })
            }

            const hasMore = (data?.length || 0) === validatedLimit

            return {
                data: data || [],
                hasMore,
                total: null
            }
        } catch (error) {
            console.error('startupService.getStartupsLightweight: Error:', error)

            if (error.message?.includes('Too many requests') ||
                error.message?.includes('Please log in')) {
                throw error
            }

            // НЕ используем sampleStartups - возвращаем пустой массив
            console.warn('startupService.getStartupsLightweight: Failed to fetch from database, returning empty array')
            return {
                data: [],
                hasMore: false,
                total: null
            }
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
    },

    // Загрузка изображений отдельно для оптимизации
    async _loadStartupImages(startupIds = []) {
        try {
            if (!Array.isArray(startupIds) || startupIds.length === 0) {
                return []
            }

            const { data, error } = await supabase.rpc('get_startup_images', {
                p_startup_ids: startupIds
            })

            if (error) {
                console.warn('startupService._loadStartupImages: RPC not available, using direct query')
                // Fallback на прямой запрос если RPC не работает
                const { data: directData, error: directError } = await supabase
                    .from('startups')
                    .select('id, image, logo_url')
                    .in('id', startupIds)

                if (directError) throw directError
                return directData || []
            }

            return data || []
        } catch (error) {
            console.error('startupService._loadStartupImages: error', error)
            return []
        }
    },

    // Get dashboard metrics
    async getDashboardMetrics() {
        try {
            // Получаем все метрики параллельно для скорости
            const [startupsCount, usersCount, chatsCount] = await Promise.all([
                // Количество стартапов
                supabase
                    .from('startups')
                    .select('*', { count: 'exact', head: true }),
                // Количество пользователей
                supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true }),
                // Количество чатов
                supabase
                    .from('chats')
                    .select('*', { count: 'exact', head: true })
            ])

            return {
                startupsCount: startupsCount.count || 0,
                usersCount: usersCount.count || 0,
                chatsCount: chatsCount.count || 0
            }
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error)
            return {
                startupsCount: 0,
                usersCount: 0,
                chatsCount: 0
            }
        }
    }
}

