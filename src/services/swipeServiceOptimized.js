import { supabase } from './supabaseClient.js'

// Debounce utility for rate limiting
const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Queue for batch operations
class SwipeQueue {
    constructor() {
        this.queue = []
        this.processing = false
        this.batchSize = 5
        this.batchDelay = 1000 // 1 second
    }

    add(action) {
        this.queue.push(action)
        this.process()
    }

    async process() {
        if (this.processing || this.queue.length === 0) return

        this.processing = true

        // Process in batches
        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.batchSize)
            await this.processBatch(batch)

            // Small delay between batches
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }

        this.processing = false
    }

    async processBatch(batch) {
        try {
            // Group by action type for efficiency
            const likes = batch.filter(action => action.type === 'like')
            const passes = batch.filter(action => action.type === 'pass')

            // Process likes and passes in parallel
            const promises = []

            if (likes.length > 0) {
                promises.push(this.processLikes(likes))
            }

            if (passes.length > 0) {
                promises.push(this.processPasses(passes))
            }

            await Promise.all(promises)
        } catch (error) {
            console.error('Batch processing error:', error)
            // Re-queue failed actions
            batch.forEach(action => {
                if (action.retries < 3) {
                    action.retries = (action.retries || 0) + 1
                    this.queue.push(action)
                }
            })
        }
    }

    async processLikes(likes) {
        // Use optimized SQL function for each like
        const promises = likes.map(like =>
            supabase.rpc('like_startup_optimized', { p_startup_id: like.startupId })
        )

        const results = await Promise.all(promises)

        // Handle results
        results.forEach((result, index) => {
            const like = likes[index]
            if (result.data?.success) {
                like.resolve?.(result.data)
            } else {
                like.reject?.(new Error(result.data?.error || 'Like failed'))
            }
        })
    }

    async processPasses(passes) {
        // Use optimized SQL function for each pass
        const promises = passes.map(pass =>
            supabase.rpc('pass_startup_optimized', { p_startup_id: pass.startupId })
        )

        const results = await Promise.all(promises)

        // Handle results
        results.forEach((result, index) => {
            const pass = passes[index]
            if (result.data?.success) {
                pass.resolve?.(result.data)
            } else {
                pass.reject?.(new Error(result.data?.error || 'Pass failed'))
            }
        })
    }
}

// Global swipe queue instance
const swipeQueue = new SwipeQueue()

export const swipeServiceOptimized = {
    // Optimized like function with batching and rate limiting
    async likeStartup(userId, startupId) {
        return new Promise((resolve, reject) => {
            // Check rate limit first
            this.checkRateLimit().then(canProceed => {
                if (!canProceed) {
                    reject(new Error('Rate limit exceeded. Please slow down.'))
                    return
                }

                // Add to queue for batch processing
                swipeQueue.add({
                    type: 'like',
                    userId,
                    startupId,
                    resolve,
                    reject,
                    timestamp: Date.now()
                })
            }).catch(reject)
        })
    },

    // Optimized pass function with batching and rate limiting
    async passStartup(userId, startupId) {
        return new Promise((resolve, reject) => {
            // Check rate limit first
            this.checkRateLimit().then(canProceed => {
                if (!canProceed) {
                    reject(new Error('Rate limit exceeded. Please slow down.'))
                    return
                }

                // Add to queue for batch processing
                swipeQueue.add({
                    type: 'pass',
                    userId,
                    startupId,
                    resolve,
                    reject,
                    timestamp: Date.now()
                })
            }).catch(reject)
        })
    },

    // Check rate limit using database function
    async checkRateLimit() {
        try {
            const { data, error } = await supabase.rpc('check_swipe_rate_limit')
            if (error) {
                console.warn('Rate limit check failed:', error)
                return true // Allow if check fails
            }
            return data
        } catch (error) {
            console.warn('Rate limit check error:', error)
            return true // Allow if check fails
        }
    },

    // Get swipe status for multiple startups in single query
    async getSwipeStatusBatch(userId, startupIds) {
        try {
            if (!startupIds || startupIds.length === 0) {
                return []
            }

            const { data, error } = await supabase.rpc('get_swipe_status_batch', {
                p_startup_ids: startupIds
            })

            if (error) throw error

            // Convert to map for easy lookup
            const statusMap = {}
            data?.forEach(item => {
                statusMap[item.startup_id] = item.status
            })

            return statusMap
        } catch (error) {
            console.error('Error getting batch swipe status:', error)
            return {}
        }
    },

    // Get lightweight user swipes (likes and passes)
    async getUserSwipesLightweight(userId, limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase.rpc('get_user_swipes_lightweight', {
                p_limit: Math.min(limit, 100), // Cap at 100
                p_offset: Math.max(offset, 0)
            })

            if (error) throw error

            return data || []
        } catch (error) {
            console.error('Error getting user swipes:', error)
            return []
        }
    },

    // Optimized function to get only likes (for saved page)
    async getUserLikesLightweight(userId, limit = 50, offset = 0) {
        try {
            const swipes = await this.getUserSwipesLightweight(userId, limit, offset)
            return swipes.filter(swipe => swipe.action === 'liked')
        } catch (error) {
            console.error('Error getting user likes:', error)
            return []
        }
    },

    // Optimized function to get only passes (for analytics)
    async getUserPassesLightweight(userId, limit = 50, offset = 0) {
        try {
            const swipes = await this.getUserSwipesLightweight(userId, limit, offset)
            return swipes.filter(swipe => swipe.action === 'passed')
        } catch (error) {
            console.error('Error getting user passes:', error)
            return []
        }
    },

    // Remove swipe (for undo functionality)
    async removeSwipe(userId, startupId) {
        try {
            // Remove both like and pass in parallel
            const [likeResult, passResult] = await Promise.all([
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

            if (likeResult.error) throw likeResult.error
            if (passResult.error) throw passResult.error

            return true
        } catch (error) {
            console.error('Error removing swipe:', error)
            throw error
        }
    },

    // Get swipe statistics for user
    async getSwipeStats(userId) {
        try {
            const [likesResult, passesResult] = await Promise.all([
                supabase
                    .from('likes')
                    .select('id', { count: 'exact' })
                    .eq('user_id', userId),
                supabase
                    .from('passes')
                    .select('id', { count: 'exact' })
                    .eq('user_id', userId)
            ])

            if (likesResult.error) throw likesResult.error
            if (passesResult.error) throw passesResult.error

            return {
                totalLikes: likesResult.count || 0,
                totalPasses: passesResult.count || 0,
                totalSwipes: (likesResult.count || 0) + (passesResult.count || 0)
            }
        } catch (error) {
            console.error('Error getting swipe stats:', error)
            return { totalLikes: 0, totalPasses: 0, totalSwipes: 0 }
        }
    }
}

// Debounced version for rapid swiping
export const swipeServiceDebounced = {
    likeStartup: debounce(swipeServiceOptimized.likeStartup.bind(swipeServiceOptimized), 300),
    passStartup: debounce(swipeServiceOptimized.passStartup.bind(swipeServiceOptimized), 300)
}
