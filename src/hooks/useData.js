import { useState, useEffect, useCallback } from 'react'
import { startupService, swipeService, chatService, profileService } from '../services/index.js'
import { useFilters } from '../context/FiltersContext'
import { sampleStartups } from '../data/startups.js'

// Hook for working with startups
export const useStartups = () => {
    const [startups, setStartups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { filters } = useFilters()

    const fetchStartups = useCallback(async () => {
        try {
            console.log('useStartups: Starting to fetch startups...')
            setLoading(true)
            setError(null)

            console.log('useStartups: Calling startupService.getAllStartups()...')
            let data = await startupService.getAllStartups()
            console.log('useStartups: Received data from startupService:', data)

            // Apply filters if any are active
            if (filters && Object.values(filters).some(value =>
                Array.isArray(value) ? value.length > 0 : value !== ''
            )) {
                console.log('useStartups: Applying filters:', filters)
                data = data.filter(startup => {
                    // Filter by industry
                    if (filters.industries.length > 0 && !filters.industries.includes(startup.industry)) {
                        return false
                    }

                    // Filter by stage
                    if (filters.stages.length > 0 && !filters.stages.includes(startup.stage)) {
                        return false
                    }

                    // Filter by location
                    if (filters.locations.length > 0 && !filters.locations.includes(startup.location)) {
                        return false
                    }

                    // Filter by team size
                    if (filters.teamSize && startup.team_size !== filters.teamSize) {
                        return false
                    }

                    // Filter by funding
                    if (filters.funding && startup.funding_round !== filters.funding) {
                        return false
                    }

                    return true
                })
                console.log('useStartups: Data after filtering:', data)
            }

            console.log('useStartups: Setting startups state with:', data)
            setStartups(data)
        } catch (err) {
            console.error('useStartups: Error fetching startups:', err)
            setError(err.message)
            // Fallback to sample data if there's an error
            console.log('useStartups: Falling back to sample data due to error')
            setStartups(sampleStartups)
        } finally {
            console.log('useStartups: Setting loading to false')
            setLoading(false)
        }
    }, [filters])

    const createStartup = useCallback(async (startupData) => {
        try {
            const newStartup = await startupService.createStartup(startupData)
            setStartups(prev => [newStartup, ...prev])
            return newStartup
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [])

    const updateStartup = useCallback(async (id, updates) => {
        try {
            const updatedStartup = await startupService.updateStartup(id, updates)
            setStartups(prev => prev.map(startup =>
                startup.id === id ? updatedStartup : startup
            ))
            return updatedStartup
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [])

    const deleteStartup = useCallback(async (id) => {
        try {
            await startupService.deleteStartup(id)
            setStartups(prev => prev.filter(startup => startup.id !== id))
            return true
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [])

    useEffect(() => {
        fetchStartups()
    }, [fetchStartups])

    return {
        startups,
        loading,
        error,
        refetch: fetchStartups,
        createStartup,
        updateStartup,
        deleteStartup
    }
}

// Hook for working with swipes
export const useSwipes = (userId) => {
    const [likes, setLikes] = useState([])
    const [passes, setPasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchSwipes = useCallback(async () => {
        if (!userId) return

        try {
            setLoading(true)
            setError(null)
            const [likesData, passesData] = await Promise.all([
                swipeService.getUserLikes(userId),
                swipeService.getUserPasses(userId)
            ])
            setLikes(likesData)
            setPasses(passesData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    const likeStartup = useCallback(async (startupId) => {
        try {
            const like = await swipeService.likeStartup(userId, startupId)
            setLikes(prev => [...prev, like])
            setPasses(prev => prev.filter(pass => pass.startup_id !== startupId))
            return like
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    const passStartup = useCallback(async (startupId) => {
        try {
            const pass = await swipeService.passStartup(userId, startupId)
            setPasses(prev => [...prev, pass])
            setLikes(prev => prev.filter(like => like.startup_id !== startupId))
            return pass
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    const removeSwipe = useCallback(async (startupId) => {
        try {
            await swipeService.removeSwipe(userId, startupId)
            setLikes(prev => prev.filter(like => like.startup_id !== startupId))
            setPasses(prev => prev.filter(pass => pass.startup_id !== startupId))
            return true
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    useEffect(() => {
        fetchSwipes()
    }, [fetchSwipes])

    return {
        likes,
        passes,
        loading,
        error,
        refetch: fetchSwipes,
        likeStartup,
        passStartup,
        removeSwipe
    }
}

// Hook for working with chats
export const useChats = (userId) => {
    const [chats, setChats] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchChats = useCallback(async () => {
        if (!userId) return

        try {
            setLoading(true)
            setError(null)
            const data = await chatService.getUserChats(userId)
            setChats(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    const createChat = useCallback(async (participantIds) => {
        try {
            const newChat = await chatService.createChat(participantIds)
            setChats(prev => [newChat, ...prev])
            return newChat
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [])

    const sendMessage = useCallback(async (chatId, body) => {
        try {
            const message = await chatService.sendMessage(chatId, userId, body)
            return message
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    useEffect(() => {
        fetchChats()
    }, [fetchChats])

    return {
        chats,
        loading,
        error,
        refetch: fetchChats,
        createChat,
        sendMessage
    }
}

// Hook for working with profile
export const useProfile = (userId) => {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchProfile = useCallback(async () => {
        if (!userId) return

        try {
            setLoading(true)
            setError(null)
            const data = await profileService.getProfile(userId)
            setProfile(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    const updateProfile = useCallback(async (updates) => {
        try {
            const updatedProfile = await profileService.updateProfile(userId, updates)
            setProfile(updatedProfile)
            return updatedProfile
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    const uploadAvatar = useCallback(async (file) => {
        try {
            const avatarUrl = await profileService.uploadAvatar(userId, file)
            setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
            return avatarUrl
        } catch (err) {
            setError(err.message)
            throw err
        }
    }, [userId])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    return {
        profile,
        loading,
        error,
        refetch: fetchProfile,
        updateProfile,
        uploadAvatar
    }
}
