import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useStartupsLazy, useSwipes } from '../hooks'
import { chatService, startupService, swipeService } from '../services'

const DesktopHomePage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const {
        startups,
        loading,
        error,
        hasMore,
        loadMore,
        loadingMore,
        refetch
    } = useStartupsLazy()
    const { likeStartup, likes, removeSwipe, refetch: refetchSwipes } = useSwipes(user?.id)
    const [likedStartups, setLikedStartups] = useState(new Set())
    // Local state for optimistic likes_count updates
    const [likesCountUpdates, setLikesCountUpdates] = useState({})

    const heroItems = useMemo(() => startups.slice(0, 5), [startups])
    const [heroIndex, setHeroIndex] = useState(0)
    const [metrics, setMetrics] = useState({
        startupsCount: 0,
        usersCount: 0,
        chatsCount: 0
    })
    const [metricsLoading, setMetricsLoading] = useState(true)

    useEffect(() => {
        setHeroIndex(0)
    }, [heroItems.length])

    useEffect(() => {
        if (heroItems.length < 2) return undefined
        const id = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % heroItems.length)
        }, 6000)
        return () => clearInterval(id)
    }, [heroItems])

    // Load dashboard metrics
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setMetricsLoading(true)
                const data = await startupService.getDashboardMetrics()
                setMetrics(data)
            } catch (error) {
                console.error('Failed to load dashboard metrics:', error)
            } finally {
                setMetricsLoading(false)
            }
        }
        loadMetrics()
    }, [])

    const ensureAuth = () => {
        if (!user?.id) {
            navigate('/login')
            return false
        }
        return true
    }

    // Update liked startups set when likes change
    useEffect(() => {
        if (likes && Array.isArray(likes)) {
            const likedIds = new Set(likes.map(like => like.startup_id || like.startup?.id))
            setLikedStartups(likedIds)
        }
    }, [likes])

    // Clear local likes_count updates when startups data is refreshed
    useEffect(() => {
        // Keep only updates for startups that are still in the list
        setLikesCountUpdates(prev => {
            const startupIds = new Set(startups.map(s => s.id))
            const filtered = {}
            Object.keys(prev).forEach(id => {
                if (startupIds.has(id)) {
                    filtered[id] = prev[id]
                }
            })
            return filtered
        })
    }, [startups])

    // Check initial like status for all startups
    useEffect(() => {
        if (!user?.id || !startups.length) return

        const checkLikes = async () => {
            try {
                const startupIds = startups.map(s => s.id).filter(Boolean)
                if (startupIds.length === 0) return

                const statusPromises = startupIds.map(id =>
                    swipeService.getSwipeStatus(user.id, id)
                )
                const statuses = await Promise.all(statusPromises)

                const likedIds = new Set()
                statuses.forEach((status, index) => {
                    if (status === 'liked') {
                        likedIds.add(startupIds[index])
                    }
                })
                setLikedStartups(likedIds)
            } catch (err) {
                console.error('Failed to check like status', err)
            }
        }

        checkLikes()
    }, [user?.id, startups])

    const handleLike = async (startupId) => {
        if (!ensureAuth()) return

        const isLiked = likedStartups.has(startupId)
        const startup = startups.find(s => s.id === startupId)
        const currentLikesCount = startup?.likes_count || 0

        // Optimistic update: update UI immediately
        setLikedStartups(prev => {
            const newSet = new Set(prev)
            if (isLiked) {
                newSet.delete(startupId)
            } else {
                newSet.add(startupId)
            }
            return newSet
        })

        // Optimistically update likes_count
        setLikesCountUpdates(prev => ({
            ...prev,
            [startupId]: isLiked
                ? Math.max(0, currentLikesCount - 1)
                : currentLikesCount + 1
        }))

        try {
            if (isLiked) {
                // Unlike - remove from database
                await removeSwipe(startupId)
            } else {
                // Like
                await likeStartup(startupId)
            }

            // Refetch swipes in background (non-blocking, don't await)
            if (refetchSwipes) {
                refetchSwipes().catch(err => console.warn('Failed to refetch swipes:', err))
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint
            })

            // Revert optimistic update on error
            setLikedStartups(prev => {
                const newSet = new Set(prev)
                if (isLiked) {
                    newSet.add(startupId)
                } else {
                    newSet.delete(startupId)
                }
                return newSet
            })

            // Revert likes_count
            setLikesCountUpdates(prev => {
                const newUpdates = { ...prev }
                delete newUpdates[startupId]
                return newUpdates
            })

            // Check if error is duplicate key (like already exists)
            const isDuplicateError = err.code === '23505' ||
                err.message?.includes('duplicate key') ||
                err.message?.includes('unique constraint')

            if (isDuplicateError && !isLiked) {
                // Like already exists in database, sync state
                console.log('Like already exists, syncing state')
                setLikedStartups(prev => new Set(prev).add(startupId))
                // Refetch to ensure state is correct
                if (refetchSwipes) {
                    await refetchSwipes()
                }
                return // Don't show error, just sync state
            }

            // For other errors, show alert and revert
            alert(`Failed to ${isLiked ? 'unlike' : 'like'} startup: ${err.message || 'Unknown error'}`)
            // Revert on error
            if (!isLiked) {
                setLikedStartups(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(startupId)
                    return newSet
                })
            } else {
                setLikedStartups(prev => new Set(prev).add(startupId))
            }
        }
    }

    const handleChat = async (startupId) => {
        if (!ensureAuth()) return

        try {
            const chatId = await chatService.getOrCreateStartupChat(startupId)
            if (chatId) {
                navigate(`/chat-detail/${chatId}`)
            }
        } catch (err) {
            console.error('Failed to open chat', err)
        }
    }

    const handleDetails = (startupId) => {
        navigate(`/startup/${startupId}`)
    }

    const renderNewsState = () => {
        if (loading) {
            return (
                <div className="news-skeleton-grid">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div className="news-card skeleton" key={`s-${idx}`}>
                            <div className="skeleton-line w-32"></div>
                            <div className="skeleton-line w-full"></div>
                            <div className="skeleton-line w-2/3"></div>
                            <div className="skeleton-actions">
                                <div className="skeleton-chip"></div>
                                <div className="skeleton-chip"></div>
                                <div className="skeleton-chip"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        if (error) {
            return (
                <div className="news-error">
                    <p>{error}</p>
                    <button type="button" className="btn-primary" onClick={() => refetch()}>
                        Retry
                    </button>
                </div>
            )
        }

        if (!startups.length) {
            return (
                <div className="news-empty">
                    <p>No startup stories yet. Adjust your filters or come back later.</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {startups.map(startup => {
                    const isLiked = likedStartups.has(startup.id)
                    const likesCount = likesCountUpdates[startup.id] !== undefined 
                        ? likesCountUpdates[startup.id] 
                        : (startup.likes_count ?? 0)
                    
                    return (
                        <article 
                            key={startup.id || startup.name} 
                            className="desktop-card group cursor-pointer hover:border-accent-primary/30 transition-all duration-300 !p-0 overflow-hidden"
                            onClick={() => handleDetails(startup.id)}
                        >
                            {/* Image Section */}
                            <div className="relative h-48 overflow-hidden">
                                {startup.image || startup.logo_url ? (
                                    <img 
                                        src={startup.image || startup.logo_url} 
                                        alt={startup.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className={`w-full h-full ${startup.gradient || 'bg-gradient-primary'} flex items-center justify-center`}>
                                        <span className="text-white font-bold text-4xl">
                                            {startup.logo || startup.name?.[0]?.toUpperCase() || 'S'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                
                                {/* Like Button - Top Right */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleLike(startup.id)
                                    }}
                                    className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all ${
                                        isLiked
                                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    }`}
                                    aria-label={isLiked ? 'Unlike startup' : 'Like startup'}
                                >
                                    <i className={`fas ${isLiked ? 'fa-heart' : 'fa-heart'} ${isLiked ? 'text-red-400' : ''}`}></i>
                                </button>

                                {/* Badges - Top Left */}
                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                    {startup.stage && (
                                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/30">
                                            {startup.stage}
                                        </span>
                                    )}
                                    {startup.funding_round && (
                                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/30">
                                            {startup.funding_round}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider">
                                            {startup.industry || 'General'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-accent-primary transition-colors">
                                        {startup.name}
                                    </h3>
                                    <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                                        {startup.description}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {startup.location && (
                                        <span className="px-2.5 py-1 bg-bg-secondary/40 border border-glass-border rounded-lg text-xs text-text-secondary">
                                            <i className="fas fa-map-marker-alt mr-1 text-accent-primary"></i>
                                            {startup.location}
                                        </span>
                                    )}
                                </div>

                                {/* Stats & Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-glass-border">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                                            <i className={`fas ${isLiked ? 'fa-heart text-red-400' : 'fa-heart'}`}></i>
                                            <span className="font-medium">{likesCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                                            <i className="fas fa-comments text-accent-primary"></i>
                                            <span className="font-medium">{startup.chat_count ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="btn-secondary py-2 px-4 rounded-xl text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleChat(startup.id)
                                            }}
                                        >
                                            <i className="fas fa-comment mr-1.5"></i>
                                            Chat
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary py-2 px-4 rounded-xl text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDetails(startup.id)
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        )
    }

    const currentHero = heroItems[heroIndex]

    return (
        <div className="desktop-home">
            <section className="desktop-hero modern">
                <div className="hero-carousel">
                    {currentHero ? (
                        <div
                            className={`hero-slide ${!currentHero.image && !currentHero.logo_url ? 'gradient' : ''}`}
                            style={{
                                backgroundImage: currentHero.image
                                    ? `url(${currentHero.image})`
                                    : currentHero.logo_url
                                        ? `url(${currentHero.logo_url})`
                                        : undefined
                            }}
                        >
                            <div className="hero-overlay">
                                <p className="hero-eyebrow">Startup news</p>
                                <h2>{currentHero.name} raised {currentHero.funding_round || 'a new round'}</h2>
                                <p className="hero-subtitle">
                                    {currentHero.description}
                                </p>
                                <button type="button" className="btn-primary hero-read-more-btn" onClick={() => handleDetails(currentHero.id)}>
                                    Read more
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="hero-slide gradient">
                            <div className="hero-overlay">
                                <p className="hero-eyebrow">Startup news</p>
                                <h2>Discover venture-ready founders</h2>
                                <p className="hero-subtitle">
                                    Real-time startup intelligence, direct messaging, and data-backed confidence for decisive investors.
                                </p>
                                <button type="button" className="btn-primary" onClick={() => navigate('/add')}>
                                    Submit startup
                                </button>
                            </div>
                        </div>
                    )}
                    {heroItems.length > 1 && (
                        <div className="hero-controls">
                            {heroItems.map((item, idx) => (
                                <button
                                    key={item.id || idx}
                                    type="button"
                                    className={idx === heroIndex ? 'active' : ''}
                                    onClick={() => setHeroIndex(idx)}
                                    aria-label={`Show hero slide ${idx + 1}`}
                                ></button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="hero-metrics modern">
                    <div className="metric-card">
                        <p className="metric-label">Startups registered</p>
                        <p className="metric-value">
                            {metricsLoading ? '...' : metrics.startupsCount}
                        </p>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">Users registered</p>
                        <p className="metric-value">
                            {metricsLoading ? '...' : metrics.usersCount}
                        </p>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">Total chats</p>
                        <p className="metric-value">
                            {metricsLoading ? '...' : metrics.chatsCount}
                        </p>
                    </div>
                </div>
            </section>

            <section className="desktop-news-section">
                <div className="section-header">
                    <div>
                        <p className="section-eyebrow">Startups</p>
                        <h3>Get acquainted with startups</h3>
                    </div>
                    <div className="section-actions">
                        {hasMore && (
                            <button
                                type="button"
                                className="btn-secondary"
                                disabled={loadingMore}
                                onClick={() => loadMore()}
                            >
                                {loadingMore ? 'Loading...' : 'Load more'}
                            </button>
                        )}
                    </div>
                </div>
                {renderNewsState()}
            </section>
        </div>
    )
}

export default DesktopHomePage

