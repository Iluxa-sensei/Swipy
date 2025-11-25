import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useStartupsLazy, useSwipes } from '../hooks'
import { chatService } from '../services'

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
    const { likeStartup } = useSwipes(user?.id)

    const spotlightStartups = useMemo(() => startups.slice(0, 3), [startups])
    const heroItems = useMemo(() => startups.slice(0, 5), [startups])
    const [heroIndex, setHeroIndex] = useState(0)

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

    const ensureAuth = () => {
        if (!user?.id) {
            navigate('/login')
            return false
        }
        return true
    }

    const handleLike = async (startupId) => {
        if (!ensureAuth()) return
        try {
            await likeStartup(startupId)
        } catch (err) {
            console.error('Failed to like startup', err)
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
                                    className="news-like-btn"
                                    onClick={() => handleLike(startup.id)}
                                    aria-label="Like startup"
                                >
                                    <i className="fa-regular fa-heart"></i>
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
                                    <i className="fa-regular fa-heart"></i>
                                    <span>{startup.likes_count ?? '—'}</span>
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
                                <button type="button" className="btn-primary" onClick={() => handleDetails(currentHero.id)}>
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
                        <p className="metric-label">Live deals</p>
                        <p className="metric-value">{startups.length || '0'}</p>
                        <span className="metric-trend positive">+12% MoM</span>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">Avg. EBITDA</p>
                        <p className="metric-value">$42k</p>
                        <span className="metric-trend neutral">stable</span>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">New chats</p>
                        <p className="metric-value">48</p>
                        <span className="metric-trend positive">+8 today</span>
                    </div>
                </div>
            </section>

            <section className="desktop-news-section">
                <div className="section-header">
                    <div>
                        <p className="section-eyebrow">Venture news</p>
                        <h3>Latest stories from ambitious startups</h3>
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

            <section className="desktop-spotlight">
                <div className="section-header compact">
                    <div>
                        <p className="section-eyebrow">Operator spotlight</p>
                        <h3>Chats worth joining today</h3>
                    </div>
                </div>
                <div className="spotlight-grid">
                    {spotlightStartups.map(startup => (
                        <div key={startup.id} className="spotlight-card">
                            <div className="spotlight-meta">
                                <span className="news-badge">{startup.industry || 'General'}</span>
                                <span>{startup.location || 'Remote'}</span>
                            </div>
                            <h4>{startup.name}</h4>
                            <p>{startup.description}</p>
                            <div className="spotlight-actions">
                                <button type="button" className="btn-secondary" onClick={() => handleChat(startup.id)}>
                                    Quick chat
                                </button>
                                <button type="button" className="btn-primary" onClick={() => handleDetails(startup.id)}>
                                    View dossier
                                </button>
                            </div>
                        </div>
                    ))}
                    {spotlightStartups.length === 0 && (
                        <div className="spotlight-empty">
                            <p>Start a conversation to populate your spotlight list.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default DesktopHomePage

