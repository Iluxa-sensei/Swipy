import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useStartups, useSwipes } from '../hooks'
import { chatService, startupService } from '../services'
import Loader from '../components/Loader.jsx'

const StartupDetailPage = () => {
    const navigate = useNavigate()
    const { id, nickname, startup_name } = useParams()
    const { user } = useAuth()
    const { startups, loading: startupsLoading, error: startupsError } = useStartups()
    const { likeStartup, passStartup, getSwipeStatus } = useSwipes(user?.id)
    const [swipeStatus, setSwipeStatus] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
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
            } catch (error) {
                console.error('Error loading swipe status:', error)
            }
        }

        loadSwipeStatus()
    }, [user?.id, startup?.id, getSwipeStatus])

    const openChat = async () => {
        if (!user?.id || !startup?.id) {
            alert('Please sign in to start a chat')
            return
        }

        try {
            setIsLoading(true)
            // Create or get existing chat for this startup
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
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Loading...</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader />
                        <h2 className="text-2xl font-bold text-text-primary mt-4 mb-4">Loading Startup</h2>
                        <p className="text-text-secondary">Please wait...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (startupsError) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Error</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Startup</h2>
                        <p className="text-text-secondary mb-6">{startupsError}</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Show loading state while fetching detail
    if (fetchingDetail) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Loading...</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader />
                        <h2 className="text-2xl font-bold text-text-primary mt-4 mb-4">Loading Startup</h2>
                        <p className="text-text-secondary">Please wait...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!startup) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Startup Not Found</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Startup Not Found</h2>
                        <p className="text-text-secondary mb-8">The startup you're looking for doesn't exist or has been removed.</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => navigate('/home')}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>{startup.name}</h1>
                <button className="header-btn" onClick={() => navigate('/saved')}>
                    <i className="fas fa-bookmark"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="card-image">
                    <div className="bg-gradient-primary w-full h-56 relative overflow-hidden">
                        {startup.logo_url ? (
                            <img
                                src={startup.logo_url}
                                alt={startup.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="company-logo">
                                <span className="text-white font-bold text-xl">
                                    {startup.name ? startup.name.substring(0, 2).toUpperCase() : 'ST'}
                                </span>
                            </div>
                        )}
                        <div className="gradient-overlay"></div>
                        <div className="card-badges">
                            <span className="badge funding">{startup.funding_round || 'N/A'}</span>
                            <span className="badge stage">{startup.stage || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold text-text-primary">Overview</h2>
                            <span className="text-text-secondary">{startup.industry || 'Startup'}</span>
                        </div>
                        <p className="text-text-secondary leading-relaxed">
                            {startup.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Funding</div>
                            <div className="text-text-primary font-semibold">{startup.funding_round || 'N/A'}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Team Size</div>
                            <div className="text-text-primary font-semibold">{startup.team_size || 'N/A'}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Location</div>
                            <div className="text-text-primary font-semibold">{startup.location || 'Remote'}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Stage</div>
                            <div className="text-text-primary font-semibold">{startup.stage || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Website Section */}
                    {startup.website && (
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="text-text-secondary text-sm flex items-center gap-2">
                                    <i className="fas fa-globe"></i>
                                    Website
                                </div>
                                <a
                                    href={startup.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium hover:underline break-all"
                                >
                                    {startup.website}
                                </a>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
                <button
                    className="bg-gradient-to-r from-accent-primary to-blue-500 hover:from-accent-primary/90 hover:to-blue-500/90 text-white px-8 py-4 rounded-full font-semibold flex items-center gap-3 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 text-lg"
                    onClick={openChat}
                    disabled={isLoading}
                >
                    <i className="fas fa-comments text-xl"></i>
                    {isLoading ? 'Opening Chat...' : 'Start Chat'}
                </button>
            </div>
        </div>
    )
}

export default StartupDetailPage


