import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { useFilters } from '../context/FiltersContext'
import { useState, useEffect, useRef } from 'react'
import { searchService } from '../services/searchService.js'

const NAV_ITEMS = [
    { id: 'home', label: 'News', icon: 'fa-regular fa-newspaper', path: '/home' },
    { id: 'chat', label: 'Chats', icon: 'fa-regular fa-comments', path: '/chat' },
    { id: 'saved', label: 'Saved', icon: 'fa-regular fa-bookmark', path: '/saved' },
    { id: 'notifications', label: 'Alerts', icon: 'fa-regular fa-bell', path: '/notifications' },
    { id: 'activity-dashboard', label: 'Insights', icon: 'fa-solid fa-chart-simple', path: '/activity-dashboard' },
    { id: 'profile', label: 'Profile', icon: 'fa-regular fa-user', path: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', path: '/settings' }
]

const DesktopLayout = ({ children, currentScreen = 'home', onScreenChange, minimal = false }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)
    const { getActiveFiltersCount } = useFilters()
    const activeFiltersCount = getActiveFiltersCount()

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0, width: 0 })
    const searchRef = useRef(null)
    const searchContainerRef = useRef(null)

    const handleNavClick = (item) => {
        if (onScreenChange) {
            onScreenChange(item.id)
        } else {
            navigate(item.path)
        }
    }

    // Search functionality
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
                return
            }

            setIsSearching(true)
            const query = searchQuery.trim()
            const isUserSearch = query.startsWith('@')
            const searchTerm = isUserSearch ? query.substring(1).trim() : query.trim()

            // Require at least 2 characters for search (after @ for user search)
            if (isUserSearch && searchTerm.length < 2) {
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
                setIsSearching(false)
                return
            }

            if (!isUserSearch && searchTerm.length < 2) {
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
                setIsSearching(false)
                return
            }

            try {
                if (isUserSearch) {
                    // Search for users only when @ prefix is used
                    const profiles = await searchService.searchProfiles(searchTerm, 5)
                    setSearchResults({ startups: [], profiles })
                } else {
                    // Search both startups and profiles simultaneously
                    const [startups, profiles] = await Promise.all([
                        searchService.searchStartups(searchTerm, 5),
                        searchService.searchProfiles(searchTerm, 5)
                    ])
                    setSearchResults({ startups, profiles })
                }
                setShowSearchResults(true)
            } catch (error) {
                console.error('Search error:', error)
                setSearchResults({ startups: [], profiles: [] })
            } finally {
                setIsSearching(false)
            }
        }

        const debounceTimer = setTimeout(performSearch, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    // Update search position when window resizes or search container changes
    useEffect(() => {
        const updateSearchPosition = () => {
            if (searchContainerRef.current) {
                const rect = searchContainerRef.current.getBoundingClientRect()
                setSearchPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width
                })
            }
        }

        updateSearchPosition()
        window.addEventListener('resize', updateSearchPosition)
        window.addEventListener('scroll', updateSearchPosition, true)

        return () => {
            window.removeEventListener('resize', updateSearchPosition)
            window.removeEventListener('scroll', updateSearchPosition, true)
        }
    }, [showSearchResults, currentScreen])

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        // Show results dropdown when typing
        if (value.trim().length >= 2) {
            setShowSearchResults(true)
        } else {
            setShowSearchResults(false)
        }
    }

    const handleResultClick = (type, item) => {
        if (type === 'startup') {
            if (item.owner_nickname && item.slug) {
                navigate(`/${item.owner_nickname}/startup/${item.slug}`)
            } else {
                navigate(`/startup/${item.id}`)
            }
        } else if (type === 'profile') {
            // Check if it's current user's profile
            if (item.id === user?.id) {
                navigate('/profile')
            } else if (item.username) {
                // Navigate to public profile page using nickname
                navigate(`/profile/${item.username}`)
            } else {
                // Fallback to ID
                navigate(`/profile/${item.id}`)
            }
        }
        setSearchQuery('')
        setShowSearchResults(false)
    }

    if (minimal) {
        return (
            <div className="desktop-minimal-wrapper">
                {children}
            </div>
        )
    }

    const navItems = [
        ...NAV_ITEMS.slice(0, 3),
        ...(profile?.role === 'founder' ? [{ id: 'add', label: 'Add Startup', icon: 'fa-solid fa-plus', path: '/add' }] : []),
        ...NAV_ITEMS.slice(3)
    ]

    return (
        <div className="desktop-shell">
            <aside className="desktop-sidebar compact">
                <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src="/Vector.png" alt="Swipy" />
                </div>
                <nav className="desktop-nav compact">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`desktop-nav-icon ${currentScreen === item.id || (item.id === 'add' && currentScreen === 'add') || currentScreen?.startsWith(item.id)
                                ? 'active'
                                : ''}`}
                            onClick={() => handleNavClick(item)}
                            title={item.label}
                        >
                            <i className={item.icon}></i>
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="desktop-main">
                {/* Header for all pages */}
                <header className="desktop-header modern">
                    <div className="desktop-header-title">
                        {currentScreen === 'home' && (
                            <>
                                <p className="desktop-header-eyebrow">Startup news</p>
                                <h1>Startups</h1>
                            </>
                        )}
                        {currentScreen === 'chat' && (
                            <>
                                <p className="desktop-header-eyebrow">Messages</p>
                                <h1>Your Conversations</h1>
                            </>
                        )}
                        {currentScreen === 'saved' && (
                            <>
                                <p className="desktop-header-eyebrow">Saved</p>
                                <h1>Your Saved Startups</h1>
                            </>
                        )}
                        {currentScreen === 'notifications' && (
                            <>
                                <p className="desktop-header-eyebrow">Notifications</p>
                                <h1>Your Alerts</h1>
                            </>
                        )}
                        {currentScreen === 'activity-dashboard' && (
                            <>
                                <p className="desktop-header-eyebrow">Insights</p>
                                <h1>Activity Dashboard</h1>
                            </>
                        )}
                        {currentScreen === 'profile' && (
                            <>
                                <p className="desktop-header-eyebrow">Profile</p>
                                <h1>Your Profile</h1>
                            </>
                        )}
                        {currentScreen === 'settings' && (
                            <>
                                <p className="desktop-header-eyebrow">Settings</p>
                                <h1>Account Settings</h1>
                            </>
                        )}
                        {!['home', 'chat', 'saved', 'notifications', 'activity-dashboard', 'profile', 'settings'].includes(currentScreen) && (
                            <>
                                <p className="desktop-header-eyebrow">Swipy</p>
                                <h1>Dashboard</h1>
                            </>
                        )}
                    </div>
                    <div className="desktop-header-actions wide">
                        {currentScreen === 'home' && (
                            <div className="desktop-search wide" ref={searchContainerRef}>
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    type="search"
                                    placeholder="Search startups or @users..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => searchQuery && setShowSearchResults(true)}
                                    ref={searchRef}
                                />
                                {isSearching && (
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.5)' }}></i>
                                )}
                                {showSearchResults && searchQuery.trim().length >= 2 && (
                                    <div className="desktop-search-results" style={{
                                        position: 'fixed',
                                        top: `${searchPosition.top}px`,
                                        left: `${searchPosition.left}px`,
                                        width: `${searchPosition.width}px`,
                                        background: 'rgba(0, 0, 0, 0.95)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '8px',
                                        zIndex: 999999,
                                        display: 'block',
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                                    }}>
                                        {isSearching ? (
                                            <div className="desktop-search-empty" style={{ padding: '20px', textAlign: 'center' }}>
                                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                                <span>Searching...</span>
                                            </div>
                                        ) : searchResults.startups.length === 0 && searchResults.profiles.length === 0 ? (
                                            <div className="desktop-search-empty">
                                                <i className="fa-solid fa-search"></i>
                                                <span>No results found</span>
                                            </div>
                                        ) : (
                                            <>
                                                {searchResults.startups.length > 0 && (
                                                    <div className="search-results-section">
                                                        <div className="search-results-header">
                                                            <i className="fa-solid fa-rocket"></i>
                                                            <span>Startups</span>
                                                        </div>
                                                        {searchResults.startups.map(startup => (
                                                            <div
                                                                key={startup.id}
                                                                className="search-result-item"
                                                                onClick={() => handleResultClick('startup', startup.id)}
                                                            >
                                                                <div className="search-result-avatar">
                                                                    {startup.logo_url ? (
                                                                        <img src={startup.logo_url} alt={startup.name} />
                                                                    ) : (
                                                                        <div className={`search-result-fallback ${startup.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'}`}>
                                                                            <span>{startup.logo || startup.name?.[0] || 'S'}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="search-result-info">
                                                                    <div className="search-result-name">{startup.name}</div>
                                                                    <div className="search-result-meta">
                                                                        {startup.industry && <span>{startup.industry}</span>}
                                                                        {startup.stage && <span>{startup.stage}</span>}
                                                                    </div>
                                                                </div>
                                                                <i className="fa-solid fa-chevron-right search-result-arrow"></i>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {searchResults.profiles.length > 0 && (
                                                    <div className="search-results-section">
                                                        <div className="search-results-header">
                                                            <i className="fa-solid fa-user"></i>
                                                            <span>People</span>
                                                        </div>
                                                        {searchResults.profiles.map(profile => (
                                                            <div
                                                                key={profile.id}
                                                                className="search-result-item"
                                                                onClick={() => handleResultClick('profile', profile.id)}
                                                            >
                                                                <div className="search-result-avatar">
                                                                    {profile.avatar_url ? (
                                                                        <img src={profile.avatar_url} alt={profile.full_name || profile.username} />
                                                                    ) : (
                                                                        <div className="search-result-fallback bg-gradient-to-br from-blue-300 to-blue-700">
                                                                            <span>{(profile.full_name || profile.username || 'U')?.[0]?.toUpperCase() || '?'}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="search-result-info">
                                                                    <div className="search-result-name">
                                                                        {profile.full_name || profile.username || 'User'}
                                                                        {profile.username && <span className="search-result-username">@{profile.username}</span>}
                                                                    </div>
                                                                    {profile.role && (
                                                                        <div className="search-result-meta">
                                                                            <span>{profile.role}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <i className="fa-solid fa-chevron-right search-result-arrow"></i>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {currentScreen === 'home' && (
                            <button
                                type="button"
                                className="desktop-icon-btn desktop-filter-btn"
                                onClick={() => navigate('/filters')}
                                title="Filters"
                            >
                                <i className="fa-solid fa-filter"></i>
                                {activeFiltersCount > 0 && (
                                    <span className="desktop-filter-badge">{activeFiltersCount}</span>
                                )}
                            </button>
                        )}
                        <button type="button" className="desktop-icon-btn" onClick={() => navigate('/notifications')}>
                            <i className="fa-regular fa-bell"></i>
                        </button>
                        <button type="button" className="desktop-icon-btn" onClick={() => navigate('/chat')}>
                            <i className="fa-regular fa-comment-dots"></i>
                        </button>
                        <div className="desktop-user-pill" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                            <div className="user-meta">
                                <p className="user-name">{profile?.username ? `@${profile.username}` : profile?.full_name || 'User'}</p>
                                <p className="user-role">{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}</p>
                            </div>
                            <div className="user-avatar">
                                {profile?.avatar_url
                                    ? <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} />
                                    : <span>{(profile?.full_name || profile?.username || 'U')?.[0]?.toUpperCase() || '?'}</span>}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="desktop-content-area">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DesktopLayout

