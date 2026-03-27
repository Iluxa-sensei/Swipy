import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useStartupsLazy, useSwipes, useProfile } from '../hooks'
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
    const { profile } = useProfile(user?.id)
    const [likedStartups, setLikedStartups] = useState(new Set())
    // Local state for optimistic likes_count updates
    const [likesCountUpdates, setLikesCountUpdates] = useState({})
    // Carousel state for news
    const [currentNewsSlide, setCurrentNewsSlide] = useState(0)

    // Auto-rotate carousel every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentNewsSlide((prev) => (prev + 1) % 2)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    // Calculate profile completeness for smart recommendation
    const getProfileCompleteness = () => {
        if (!profile) return 0
        const fields = ['full_name', 'username', 'bio', 'location', 'avatar_url', 'role', 'website']
        const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '').length
        const interestsFilled = profile.interests && profile.interests.length > 0 ? 1 : 0
        return Math.round(((filled + interestsFilled) / (fields.length + 1)) * 100)
    }

    const getSmartRecommendation = () => {
        const completeness = getProfileCompleteness()
        if (completeness < 70) {
            return {
                icon: 'fa-user-pen',
                title: 'Complete Your Profile',
                description: `Your profile is ${completeness}% complete. A full profile helps you get better matches and visibility.`,
                buttonText: 'Fill Profile',
                action: () => navigate('/profile/edit'),
                gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                iconBg: 'rgba(99, 102, 241, 0.2)',
                iconColor: '#a78bfa',
                progress: completeness
            }
        }
        if (!startups.some(s => s.owner_id === user?.id)) {
            return {
                icon: 'fa-rocket',
                title: 'Add Your Startup',
                description: 'Showcase your startup to investors and connect with potential partners worldwide.',
                buttonText: 'Add Startup',
                action: () => navigate('/add'),
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                iconBg: 'rgba(245, 158, 11, 0.2)',
                iconColor: '#fbbf24',
                progress: null
            }
        }
        return {
            icon: 'fa-comments',
            title: 'Start a Conversation',
            description: 'Connect with founders and investors. Direct messaging builds real partnerships.',
            buttonText: 'Browse Startups',
            action: () => navigate('/home'),
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            iconBg: 'rgba(59, 130, 246, 0.2)',
            iconColor: '#60a5fa',
            progress: null
        }
    }

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
                // Navigate directly using chatId - the chat is associated with the startup, not the owner
                navigate(`/chat-detail/${chatId}`)
            }
        } catch (err) {
            console.error('Failed to open chat', err)
        }
    }

    const handleDetails = async (startupId) => {
        // Helper to check if string is a UUID (meaning user hasn't set a proper username)
        const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
        
        const startup = startups.find(s => s.id === startupId)
        // Try to get owner nickname and slug from startup data
        if (startup && startup.slug) {
            // Check for owner_nickname (from SQL function)
            // Only use if it's a proper username, not a UUID
            if (startup.owner_nickname && !isUUID(startup.owner_nickname)) {
                navigate(`/${startup.owner_nickname}/startup/${startup.slug}`)
                return
            }
            // Check for profiles.username (from relation)
            if (startup.profiles?.username && !isUUID(startup.profiles.username)) {
                navigate(`/${startup.profiles.username}/startup/${startup.slug}`)
                return
            }
        }
        // Fallback: fetch startup details to get slug and owner info
        try {
            const startupData = await startupService.getStartupById(startupId)
            if (startupData && startupData.slug) {
                const ownerUsername = startupData.profiles?.username
                // Only use username-based URL if owner has a proper username (not UUID)
                if (ownerUsername && !isUUID(ownerUsername)) {
                    navigate(`/${ownerUsername}/startup/${startupData.slug}`)
                    return
                }
            }
        } catch (error) {
            console.error('Error fetching startup details:', error)
        }
        // Final fallback: use ID-based route (works for users without usernames)
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

    const recommendation = getSmartRecommendation()

    // News carousel data
    const newsSlides = [
        {
            id: 1,
            badge: 'Breaking News',
            title: 'OpenAI raises $110B in one of the largest private funding rounds in history',
            description: 'The new funding consists of a $50B investment from Amazon, $30B each from Nvidia and SoftBank, against a $730B pre-money valuation.',
            image: '/news.png',
            buttonText: 'Read More',
            link: 'https://techcrunch.com/2026/02/27/openai-raises-110b-in-one-of-the-largest-private-funding-rounds-in-history/'
        },
        {
            id: 2,
            badge: 'Latest Release',
            title: 'Lyto AI recently launched',
            description: 'Discover the new AI research assistant that\'s transforming how professionals conduct research and analysis.',
            image: '/lyto.png',
            buttonText: 'Try Now',
            link: 'https://www.trylyto.com/'
        }
    ]

    const nextSlide = () => {
        setCurrentNewsSlide((prev) => (prev + 1) % newsSlides.length)
    }

    const prevSlide = () => {
        setCurrentNewsSlide((prev) => (prev - 1 + newsSlides.length) % newsSlides.length)
    }

    const currentSlide = newsSlides[currentNewsSlide]

    return (
        <div className="desktop-home">
            {/* News Carousel Banner */}
            <section style={{
                position: 'relative',
                borderRadius: '28px',
                overflow: 'hidden',
                height: '360px',
                marginBottom: '24px'
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${currentSlide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.35,
                    transition: 'all 0.5s ease'
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.85) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(10, 10, 20, 0.9) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '32px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    gap: '0'
                }}>
                    <div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            width: 'fit-content'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{currentSlide.badge}</span>
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                            fontWeight: '800',
                            lineHeight: '1.2',
                            color: '#fff',
                            maxWidth: '700px',
                            letterSpacing: '-0.02em',
                            transition: 'all 0.3s ease',
                            margin: '0'
                        }}>
                            {currentSlide.title}
                        </h2>
                        <p style={{
                            fontSize: '0.95rem',
                            color: 'rgba(255,255,255,0.6)',
                            maxWidth: '550px',
                            lineHeight: '1.6',
                            transition: 'all 0.3s ease',
                            margin: '0'
                        }}>
                            {currentSlide.description}
                        </p>
                        <a
                            href={currentSlide.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#3b82f6',
                                color: '#fff',
                                padding: '12px 28px',
                                borderRadius: '14px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textDecoration: 'none',
                                width: 'fit-content',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            {currentSlide.buttonText}
                            <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
                        </a>
                    </div>
                </div>

                {/* Carousel Navigation */}
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 10,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    {/* Slide indicators */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginRight: '8px'
                    }}>
                        {newsSlides.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentNewsSlide(index)}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: index === currentNewsSlide ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigation arrows */}
                    <button
                        type="button"
                        onClick={prevSlide}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontSize: '18px'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                        aria-label="Previous slide"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontSize: '18px'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                        aria-label="Next slide"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </section>

            {/* Smart Action Cards */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {/* Column 1: Smart Recommendation */}
                <div style={{
                    padding: '24px',
                    borderRadius: '22px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                    onClick={recommendation.action}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: recommendation.gradient, opacity: 0.07, borderRadius: '0 0 0 100%' }} />
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: recommendation.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: recommendation.iconColor
                    }}>
                        <i className={`fas ${recommendation.icon}`}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                            Recommendation
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                            {recommendation.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                            {recommendation.description}
                        </p>
                    </div>
                    {recommendation.progress !== null && (
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Profile completeness</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a78bfa' }}>{recommendation.progress}%</span>
                            </div>
                            <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>
                                <div style={{ height: '100%', borderRadius: '4px', width: `${recommendation.progress}%`, background: recommendation.gradient, transition: 'width 0.5s ease' }} />
                            </div>
                        </div>
                    )}
                    <button type="button" style={{
                        marginTop: recommendation.progress !== null ? '8px' : 'auto',
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s ease', width: '100%'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    >
                        {recommendation.buttonText} →
                    </button>
                </div>

                {/* Column 2: New Feature - Swipy Jobs */}
                <div style={{
                    padding: '24px',
                    borderRadius: '22px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                    onClick={() => navigate('/jobs')}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', opacity: 0.07, borderRadius: '0 0 0 100%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: 'rgba(59,130,246,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', color: '#60a5fa'
                        }}>
                            <i className="fas fa-wand-magic-sparkles"></i>
                        </div>
                        <span style={{
                            padding: '4px 10px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            fontSize: '0.65rem', fontWeight: '700', color: '#fff',
                            textTransform: 'uppercase', letterSpacing: '0.08em'
                        }}>New</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                            New Feature
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                            AI Search for Vacancies
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                            Find your dream job at innovative startups. Powered by AI to match your skills and preferences perfectly.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <i className="fas fa-briefcase" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}></i>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Swipy Jobs</span>
                    </div>
                    <button type="button" style={{
                        marginTop: 'auto',
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s ease', width: '100%'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        Try Now →
                    </button>
                </div>

                {/* Column 3: Discover & Explore */}
                <div style={{
                    padding: '24px',
                    borderRadius: '22px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                    onClick={() => { document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', opacity: 0.07, borderRadius: '0 0 0 100%' }} />
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'rgba(239,68,68,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: '#f87171'
                    }}>
                        <i className="fas fa-fire-flame-curved"></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                            Trending
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                            Swipe & Discover
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                            Browse curated startups, swipe right to connect, and build your investment portfolio effortlessly.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {['AI/ML', 'FinTech', 'HealthTech'].map(tag => (
                            <span key={tag} style={{
                                padding: '4px 10px', borderRadius: '8px',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                fontSize: '0.7rem', fontWeight: '600', color: '#f87171'
                            }}>{tag}</span>
                        ))}
                    </div>
                    <button type="button" style={{
                        marginTop: 'auto',
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s ease', width: '100%'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    >
                        Explore Now →
                    </button>
                </div>
            </section>

            <section id="startups-section" className="desktop-news-section">
                <div className="section-header">
                    <div>
                        <p className="section-eyebrow">Startups</p>
                        <h3>Get acquainted with startups</h3>
                    </div>
                </div>
                {renderNewsState()}
                {hasMore && (
                    <div
                        style={{
                            marginTop: '24px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={loadingMore}
                            onClick={() => loadMore()}
                            style={{
                                borderRadius: '999px',
                                paddingLeft: '28px',
                                paddingRight: '28px',
                            }}
                        >
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default DesktopHomePage

