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
            <div className="news-grid modern">
                {startups.map(startup => (
                    <article key={startup.id || startup.name} className="news-card modern">
                        <div className="news-card-cover">
                            {startup.image || startup.logo_url ? (
                                <img src={startup.image || startup.logo_url} alt={startup.name} />
                            ) : (
                                <div className={`news-card-fallback ${startup.gradient || ''}`}>
                                    <span>{startup.logo || startup.name?.[0] || 'S'}</span>
                                </div>
                            )}
                            <div className="news-card-slider">
                                <button type="button" aria-label="Previous card">
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button type="button" aria-label="Next card">
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div className="news-card-body">
                            <div className="news-card-header">
                                <div>
                                    <p className="news-card-category">{startup.industry || 'General'}</p>
                                    <h3 className="news-card-title">{startup.name}</h3>
                                </div>
                                <button
                                    type="button"
                                    className={`news-like-btn ${likedStartups.has(startup.id) ? 'liked' : ''}`}
                                    onClick={() => handleLike(startup.id)}
                                    aria-label={likedStartups.has(startup.id) ? 'Unlike startup' : 'Like startup'}
                                >
                                    <i className={likedStartups.has(startup.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                                </button>
                            </div>
                            <p className="news-card-description">{startup.description}</p>
                            <div className="news-card-tags">
                                {startup.stage && <span>{startup.stage}</span>}
                                {startup.funding_round && <span>{startup.funding_round}</span>}
                                {startup.location && <span>{startup.location}</span>}
                            </div>
                        </div>
                        <div className="news-card-footer">
                            <div className="news-card-stats">
                                <div>
                                    <i className={likedStartups.has(startup.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                                    <span>{likesCountUpdates[startup.id] !== undefined ? likesCountUpdates[startup.id] : (startup.likes_count ?? '—')}</span>
                                </div>
                                <div>
                                    <i className="fa-regular fa-comment"></i>
                                    <span>{startup.chat_count ?? '—'}</span>
                                </div>
                            </div>
                            <div className="news-card-actions compact">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => handleChat(startup.id)}
                                >
                                    Chat
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleDetails(startup.id)}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
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

