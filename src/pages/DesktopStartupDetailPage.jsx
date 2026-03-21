import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useStartups, useSwipes } from '../hooks'
import { chatService, startupService } from '../services'
import { normalizeExternalUrl } from '../utils/security.js'
import Loader from '../components/Loader.jsx'

const DesktopStartupDetailPage = () => {
    const navigate = useNavigate()
    const { id, nickname, startup_name } = useParams()
    const { user } = useAuth()
    const { startups, loading: startupsLoading, error: startupsError } = useStartups()
    const { likeStartup, removeSwipe, getSwipeStatus } = useSwipes(user?.id)
    const [swipeStatus, setSwipeStatus] = useState(null)
    const [isLiked, setIsLiked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isLiking, setIsLiking] = useState(false)
    const [fetchedStartup, setFetchedStartup] = useState(null)
    const [fetchingDetail, setFetchingDetail] = useState(false)

    // Get startup by ID or Slug
    const startup = useMemo(() => {
        if (fetchedStartup) return fetchedStartup
        if (id) return startups.find(s => s.id === id) || null
        if (nickname && startup_name) {
            const normalizedNickname = nickname.startsWith('@') ? nickname.substring(1) : nickname
            
            // Check if nickname is a UUID (user hasn't set username)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            const isUUID = uuidRegex.test(normalizedNickname)
            
            return startups.find(s => {
                if (s.slug !== startup_name) return false
                
                if (isUUID) {
                    // If nickname is a UUID, match against owner_id
                    return s.owner_id === normalizedNickname
                }
                
                // Check owner_nickname, profiles.username, and owner_id (case-insensitive)
                return s.owner_nickname?.toLowerCase() === normalizedNickname.toLowerCase() || 
                       s.profiles?.username?.toLowerCase() === normalizedNickname.toLowerCase() ||
                       s.owner_id === normalizedNickname
            }) || null
        }
        return null
    }, [id, nickname, startup_name, startups, fetchedStartup])

    // Fetch detail if not in list
    useEffect(() => {
        const fetchDetail = async () => {
            if (!startup && !startupsLoading) {
                try {
                    if (id) {
                        setFetchingDetail(true)
                        const data = await startupService.getStartupById(id)
                        if (data) {
                            setFetchedStartup(data)
                        }
                    } else if (nickname && startup_name) {
                        setFetchingDetail(true)
                        const normalizedNickname = nickname.startsWith('@') ? nickname.substring(1) : nickname
                        const data = await startupService.getStartupBySlug(normalizedNickname, startup_name)
                        if (data) {
                            setFetchedStartup(data)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching startup detail:', error)
                } finally {
                    setFetchingDetail(false)
                }
            }
        }
        fetchDetail()
    }, [id, nickname, startup_name, startup, startupsLoading])

    // Load swipe status
    useEffect(() => {
        const loadSwipeStatus = async () => {
            if (!user?.id || !startup?.id) return

            try {
                const status = await getSwipeStatus(startup.id)
                setSwipeStatus(status)
                setIsLiked(status === 'liked')
            } catch (error) {
                console.error('Error loading swipe status:', error)
            }
        }

        loadSwipeStatus()
    }, [user?.id, startup?.id, getSwipeStatus])

    const handleLike = async () => {
        if (!user?.id) {
            navigate('/login')
            return
        }

        setIsLiking(true)
        try {
            if (isLiked) {
                await removeSwipe(startup.id)
                setIsLiked(false)
            } else {
                await likeStartup(startup.id)
                setIsLiked(true)
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            alert('Failed to update like status')
        } finally {
            setIsLiking(false)
        }
    }

    const openChat = async () => {
        if (!user?.id || !startup?.id) {
            alert('Please sign in to start a chat')
            return
        }

        try {
            setIsLoading(true)
            const chatId = await chatService.getOrCreateStartupChat(startup.id)
            if (chatId) {
                // Navigate directly using chatId - the chat is associated with the startup, not the owner
                navigate(`/chat-detail/${chatId}`)
            }
        } catch (error) {
            console.error('Error opening chat:', error)
            alert('Failed to open chat. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading state
    if (startupsLoading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <div className="text-text-secondary mt-4">Loading startup...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (startupsError) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Startup</h2>
                            <p className="text-text-secondary mb-6">{startupsError}</p>
                            <button
                                className="btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Show loading state while fetching detail
    if (fetchingDetail) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <div className="text-text-secondary mt-4">Loading startup...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!startup) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Startup Not Found</h2>
                            <p className="text-text-secondary mb-8">The startup you're looking for doesn't exist or has been removed.</p>
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/home')}
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            {/* Header with back button and actions */}
            <div className="desktop-page-section !pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 flex items-center justify-center bg-bg-secondary/40 border border-glass-border rounded-xl text-text-primary hover:bg-glass-border transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{startup.name}</h1>
                            <p className="text-text-secondary text-sm mt-1">{startup.industry || 'Startup'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${
                                isLiked
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-bg-secondary/40 border-glass-border text-text-secondary hover:border-accent-primary/30'
                            }`}
                            onClick={handleLike}
                            disabled={isLiking}
                        >
                            <i className={`fas ${isLiked ? 'fa-heart' : 'fa-heart'} ${isLiked ? 'text-red-400' : ''}`}></i>
                        </button>
                        <button
                            className="w-12 h-12 flex items-center justify-center bg-bg-secondary/40 border border-glass-border rounded-xl text-text-secondary hover:border-accent-primary/30 transition-colors"
                            onClick={() => navigate('/saved')}
                        >
                            <i className="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="col-span-2 space-y-6">
                        {/* Hero Image */}
                        <div className="desktop-card !p-0 overflow-hidden">
                            <div className={`h-80 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                                {startup.image || startup.logo_url ? (
                                    <img
                                        src={startup.image || startup.logo_url}
                                        alt={startup.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                                            <span className="text-white font-bold text-4xl">
                                                {startup.name ? startup.name.substring(0, 2).toUpperCase() : 'ST'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {startup.funding_round && (
                                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/30">
                                            {startup.funding_round}
                                        </span>
                                    )}
                                    {startup.stage && (
                                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/30">
                                            {startup.stage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Overview Section */}
                        <div className="desktop-card">
                            <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-info-circle text-accent-primary"></i>
                                Overview
                            </h2>
                            <p className="text-text-primary leading-relaxed text-base">
                                {startup.description || 'No description available.'}
                            </p>
                        </div>

                        {/* Additional Information */}
                        {(startup.website || startup.location) && (
                            <div className="desktop-card">
                                <h2 className="text-xl font-bold text-text-primary mb-4">Additional Information</h2>
                                <div className="space-y-3">
                                    {startup.website && (
                                        <div className="flex items-center gap-3 p-4 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                            <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                                                <i className="fas fa-globe text-accent-primary"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-text-secondary mb-1">Website</div>
                                                <a
                                                    href={normalizeExternalUrl(startup.website) || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium hover:underline break-all"
                                                >
                                                    {startup.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {startup.location && (
                                        <div className="flex items-center gap-3 p-4 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                            <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                                                <i className="fas fa-map-marker-alt text-accent-primary"></i>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-text-secondary mb-1">Location</div>
                                                <div className="text-text-primary font-medium">{startup.location}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Stats & Actions */}
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="desktop-card">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Key Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-bg-secondary/40 border border-glass-border rounded-xl text-center">
                                    <div className="text-text-secondary text-xs mb-1">Funding</div>
                                    <div className="text-text-primary font-bold text-lg">{startup.funding_round || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 border border-glass-border rounded-xl text-center">
                                    <div className="text-text-secondary text-xs mb-1">Team Size</div>
                                    <div className="text-text-primary font-bold text-lg">{startup.team_size || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 border border-glass-border rounded-xl text-center">
                                    <div className="text-text-secondary text-xs mb-1">Location</div>
                                    <div className="text-text-primary font-bold text-lg">{startup.location || 'Remote'}</div>
                                </div>
                                <div className="p-4 bg-bg-secondary/40 border border-glass-border rounded-xl text-center">
                                    <div className="text-text-secondary text-xs mb-1">Stage</div>
                                    <div className="text-text-primary font-bold text-lg">{startup.stage || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="desktop-card">
                            <h3 className="text-xl font-bold text-text-primary mb-4">Statistics</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-heart text-red-400"></i>
                                        <span className="text-text-secondary text-sm">Likes</span>
                                    </div>
                                    <span className="text-text-primary font-semibold">{startup.likes_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-comments text-accent-primary"></i>
                                        <span className="text-text-secondary text-sm">Chats</span>
                                    </div>
                                    <span className="text-text-primary font-semibold">{startup.chat_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            className="w-full btn-primary py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
                            onClick={openChat}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Opening Chat...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-comments"></i>
                                    Start Chat
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DesktopStartupDetailPage

