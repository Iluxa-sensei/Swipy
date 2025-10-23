import { useState, useCallback, useRef, useEffect } from 'react'
import { swipeServiceOptimized } from '../services/swipeServiceOptimized.js'

// Custom hook for optimized swipe functionality
export const useSwipesOptimized = (userId) => {
    const [likes, setLikes] = useState([])
    const [passes, setPasses] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({ totalLikes: 0, totalPasses: 0, totalSwipes: 0 })

    // Refs for optimistic updates
    const pendingActions = useRef(new Map())
    const lastFetchTime = useRef(0)
    const CACHE_DURATION = 30000 // 30 seconds

    // Optimistic update helper
    const optimisticUpdate = useCallback((startupId, action, startupData) => {
        const actionKey = `${action}-${startupId}`
        pendingActions.current.set(actionKey, { startupId, action, startupData, timestamp: Date.now() })

        if (action === 'like') {
            setLikes(prev => {
                // Check if already exists
                if (prev.some(like => like.startup_id === startupId)) return prev

                // Add optimistic like
                return [{
                    id: `temp-${Date.now()}`,
                    startup_id: startupId,
                    action: 'liked',
                    created_at: new Date().toISOString(),
                    startup_name: startupData?.name || 'Loading...',
                    startup_logo: startupData?.logo,
                    startup_gradient: startupData?.gradient,
                    isOptimistic: true
                }, ...prev]
            })

            // Remove from passes if exists
            setPasses(prev => prev.filter(pass => pass.startup_id !== startupId))
        } else if (action === 'pass') {
            setPasses(prev => {
                // Check if already exists
                if (prev.some(pass => pass.startup_id === startupId)) return prev

                // Add optimistic pass
                return [{
                    id: `temp-${Date.now()}`,
                    startup_id: startupId,
                    action: 'passed',
                    created_at: new Date().toISOString(),
                    startup_name: startupData?.name || 'Loading...',
                    startup_logo: startupData?.logo,
                    startup_gradient: startupData?.gradient,
                    isOptimistic: true
                }, ...prev]
            })

            // Remove from likes if exists
            setLikes(prev => prev.filter(like => like.startup_id !== startupId))
        }
    }, [])

    // Revert optimistic update on error
    const revertOptimisticUpdate = useCallback((startupId, action) => {
        const actionKey = `${action}-${startupId}`
        pendingActions.current.delete(actionKey)

        if (action === 'like') {
            setLikes(prev => prev.filter(like => like.startup_id !== startupId || !like.isOptimistic))
        } else if (action === 'pass') {
            setPasses(prev => prev.filter(pass => pass.startup_id !== startupId || !pass.isOptimistic))
        }
    }, [])

    // Clean up old optimistic updates
    const cleanupOptimisticUpdates = useCallback(() => {
        const now = Date.now()
        const maxAge = 10000 // 10 seconds

        for (const [key, action] of pendingActions.current.entries()) {
            if (now - action.timestamp > maxAge) {
                pendingActions.current.delete(key)
                revertOptimisticUpdate(action.startupId, action.action)
            }
        }
    }, [revertOptimisticUpdate])

    // Fetch user swipes with caching
    const fetchSwipes = useCallback(async (forceRefresh = false) => {
        if (!userId) return

        const now = Date.now()
        if (!forceRefresh && now - lastFetchTime.current < CACHE_DURATION) {
            return // Use cached data
        }

        try {
            setLoading(true)
            setError(null)

            // Fetch lightweight data
            const [swipesData, statsData] = await Promise.all([
                swipeServiceOptimized.getUserSwipesLightweight(userId, 100, 0),
                swipeServiceOptimized.getSwipeStats(userId)
            ])

            // Separate likes and passes
            const likesData = swipesData.filter(swipe => swipe.action === 'liked')
            const passesData = swipesData.filter(swipe => swipe.action === 'passed')

            setLikes(likesData)
            setPasses(passesData)
            setStats(statsData)
            lastFetchTime.current = now

        } catch (err) {
            setError(err.message)
            console.error('Error fetching swipes:', err)
        } finally {
            setLoading(false)
        }
    }, [userId])

    // Optimized like function
    const likeStartup = useCallback(async (startupId, startupData = null) => {
        if (!userId || !startupId) return

        try {
            // Optimistic update
            optimisticUpdate(startupId, 'like', startupData)

            // Perform actual like
            const result = await swipeServiceOptimized.likeStartup(userId, startupId)

            if (result.success) {
                // Remove optimistic flag
                setLikes(prev => prev.map(like =>
                    like.startup_id === startupId && like.isOptimistic
                        ? { ...like, isOptimistic: false, id: result.id || like.id }
                        : like
                ))

                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalLikes: prev.totalLikes + 1,
                    totalSwipes: prev.totalSwipes + 1
                }))
            } else {
                throw new Error(result.error || 'Like failed')
            }

            return result
        } catch (err) {
            // Revert optimistic update
            revertOptimisticUpdate(startupId, 'like')
            setError(err.message)
            throw err
        }
    }, [userId, optimisticUpdate, revertOptimisticUpdate])

    // Optimized pass function
    const passStartup = useCallback(async (startupId, startupData = null) => {
        if (!userId || !startupId) return

        try {
            // Optimistic update
            optimisticUpdate(startupId, 'pass', startupData)

            // Perform actual pass
            const result = await swipeServiceOptimized.passStartup(userId, startupId)

            if (result.success) {
                // Remove optimistic flag
                setPasses(prev => prev.map(pass =>
                    pass.startup_id === startupId && pass.isOptimistic
                        ? { ...pass, isOptimistic: false, id: result.id || pass.id }
                        : pass
                ))

                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalPasses: prev.totalPasses + 1,
                    totalSwipes: prev.totalSwipes + 1
                }))
            } else {
                throw new Error(result.error || 'Pass failed')
            }

            return result
        } catch (err) {
            // Revert optimistic update
            revertOptimisticUpdate(startupId, 'pass')
            setError(err.message)
            throw err
        }
    }, [userId, optimisticUpdate, revertOptimisticUpdate])

    // Batch status check for multiple startups
    const getSwipeStatusBatch = useCallback(async (startupIds) => {
        if (!userId || !startupIds || startupIds.length === 0) return {}

        try {
            return await swipeServiceOptimized.getSwipeStatusBatch(userId, startupIds)
        } catch (err) {
            console.error('Error getting batch swipe status:', err)
            return {}
        }
    }, [userId])

    // Remove swipe (undo functionality)
    const removeSwipe = useCallback(async (startupId) => {
        if (!userId || !startupId) return

        try {
            await swipeServiceOptimized.removeSwipe(userId, startupId)

            // Remove from both likes and passes
            setLikes(prev => prev.filter(like => like.startup_id !== startupId))
            setPasses(prev => prev.filter(pass => pass.startup_id !== startupId))

            // Refresh stats
            const statsData = await swipeServiceOptimized.getSwipeStats(userId)
            setStats(statsData)

            return true
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    // Load more likes (for pagination)
    const loadMoreLikes = useCallback(async (offset = 0, limit = 20) => {
        if (!userId) return []

        try {
            const likesData = await swipeServiceOptimized.getUserLikesLightweight(userId, limit, offset)
            return likesData
        } catch (err) {
            console.error('Error loading more likes:', err)
            return []
        }
    }, [userId])

    // Load more passes (for analytics)
    const loadMorePasses = useCallback(async (offset = 0, limit = 20) => {
        if (!userId) return []

        try {
            const passesData = await swipeServiceOptimized.getUserPassesLightweight(userId, limit, offset)
            return passesData
        } catch (err) {
            console.error('Error loading more passes:', err)
            return []
        }
    }, [userId])

    // Auto-cleanup optimistic updates
    useEffect(() => {
        const interval = setInterval(cleanupOptimisticUpdates, 5000) // Every 5 seconds
        return () => clearInterval(interval)
    }, [cleanupOptimisticUpdates])

    // Initial fetch
    useEffect(() => {
        if (userId) {
            fetchSwipes()
        }
    }, [userId, fetchSwipes])

    return {
        // Data
        likes,
        passes,
        stats,
        loading,
        error,

        // Actions
        likeStartup,
        passStartup,
        removeSwipe,
        getSwipeStatusBatch,

        // Pagination
        loadMoreLikes,
        loadMorePasses,

        // Utilities
        fetchSwipes,
        clearError: () => setError(null)
    }
}
