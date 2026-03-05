import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { useFilters } from '../context/FiltersContext'
import { useJobSearchFilters } from '../context/JobSearchFiltersContext.jsx'
import { useState, useEffect, useRef } from 'react'
import { searchService } from '../services/searchService.js'

const NAV_ITEMS = [
    { id: 'home', label: 'News', icon: 'fa-regular fa-newspaper', path: '/home' },
    { id: 'chat', label: 'Chats', icon: 'fa-regular fa-comments', path: '/chat' },
    { id: 'saved', label: 'Saved', icon: 'fa-regular fa-bookmark', path: '/saved' },
    { id: 'jobs', label: 'Jobs', icon: 'fa-solid fa-briefcase', path: '/jobs' },
    { id: 'notifications', label: 'Alerts', icon: 'fa-regular fa-bell', path: '/notifications' },
    { id: 'activity-dashboard', label: 'Insights', icon: 'fa-solid fa-chart-simple', path: '/activity-dashboard' },
    { id: 'profile', label: 'Profile', icon: 'fa-regular fa-user', path: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', path: '/settings' }
]

const JOB_FILTER_OPTIONS = [
    {
        id: 'remote',
        label: 'Remote only',
        description: 'Roles that mention remote or work from home in the location.',
        icon: 'fa-solid fa-globe'
    },
    {
        id: 'high-salary',
        label: 'Top compensation',
        description: 'Prioritise roles with clearly specified, higher salary bands.',
        icon: 'fa-solid fa-arrow-trend-up'
    },
    {
        id: 'senior',
        label: 'Senior & Lead',
        description: 'Leadership, staff, and senior individual contributor roles.',
        icon: 'fa-solid fa-user-tie'
    },
    {
        id: 'mid-level',
        label: 'Mid-level',
        description: 'Solid experience required but not a leadership position.',
        icon: 'fa-solid fa-layer-group'
    },
    {
        id: 'junior',
        label: 'Junior & Intern',
        description: 'Entry-level roles and internships with mentorship.',
        icon: 'fa-solid fa-seedling'
    },
    {
        id: 'full-time',
        label: 'Full-time',
        description: 'Permanent, full-time positions.',
        icon: 'fa-solid fa-clock'
    },
    {
        id: 'contract',
        label: 'Contract & Freelance',
        description: 'Short-term or contract-based engagements.',
        icon: 'fa-solid fa-briefcase'
    },
    {
        id: 'fast-growing',
        label: 'Fast-growing teams',
        description: 'Companies hiring aggressively across multiple roles.',
        icon: 'fa-solid fa-bolt'
    }
]

const MAX_JOB_FILTERS = 5

const HOME_FILTER_DATA = {
    industries: {
        label: 'Industries',
        icon: 'fa-solid fa-tags',
        items: ["AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability", "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"]
    },
    stages: {
        label: 'Stages',
        icon: 'fa-solid fa-chart-line',
        items: ["Idea", "MVP", "Seed", "Series A", "Series B", "Series C+"]
    },
    locations: {
        label: 'Locations',
        icon: 'fa-solid fa-location-dot',
        items: ["Remote", "Asia", "Europe", "North America", "South America", "Africa", "Australia"]
    },
    teamSize: {
        label: 'Team Size',
        icon: 'fa-solid fa-users',
        items: ["1-5", "6-10", "11-25", "26-50", "50+"]
    },
    funding: {
        label: 'Funding',
        icon: 'fa-solid fa-money-bill-trend-up',
        items: ["Bootstrapped", "Under $1K", "Under $10K", "Under $100K", "$500K+"]
    }
}

const DesktopLayout = ({ children, currentScreen = 'home', onScreenChange, minimal = false }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)
    const {
        filters: homeFilters,
        toggleIndustry,
        toggleStage,
        toggleLocation,
        setTeamSize,
        setFunding,
        clearFilters: clearHomeFilters,
        getActiveFiltersCount,
    } = useFilters()
    const activeFiltersCount = getActiveFiltersCount()
    const { jobFilters: selectedJobFilters, setJobFilters: setSelectedJobFilters } = useJobSearchFilters()

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0, width: 0 })
    const searchRef = useRef(null)
    const searchContainerRef = useRef(null)

    // Home filter popover state
    const [isHomeFilterOpen, setIsHomeFilterOpen] = useState(false)
    const [homeFilterPos, setHomeFilterPos] = useState({ top: 0, right: 0 })
    const [activeHomeTab, setActiveHomeTab] = useState('industries')
    const homeFilterRef = useRef(null)
    const homeFilterBtnRef = useRef(null)

    // Jobs filter popover state (desktop jobs page)
    const [isJobFilterOpen, setIsJobFilterOpen] = useState(false)
    const [jobFilterError, setJobFilterError] = useState('')
    const [jobFilterPos, setJobFilterPos] = useState({ top: 0, right: 0 })
    const jobFilterRef = useRef(null)
    const jobFilterBtnRef = useRef(null)

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

    // Close home filters popover when clicking outside
    useEffect(() => {
        if (!isHomeFilterOpen) return

        const handleClickOutside = (event) => {
            const clickedInsidePopover = homeFilterRef.current && homeFilterRef.current.contains(event.target)
            const clickedInsideBtn = homeFilterBtnRef.current && homeFilterBtnRef.current.contains(event.target)
            if (!clickedInsidePopover && !clickedInsideBtn) {
                setIsHomeFilterOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isHomeFilterOpen])

    // Close job filters popover when clicking outside
    useEffect(() => {
        if (!isJobFilterOpen) return

        const handleClickOutside = (event) => {
            const clickedInsidePopover = jobFilterRef.current && jobFilterRef.current.contains(event.target)
            const clickedInsideBtn = jobFilterBtnRef.current && jobFilterBtnRef.current.contains(event.target)
            if (!clickedInsidePopover && !clickedInsideBtn) {
                setIsJobFilterOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isJobFilterOpen])

    const toggleHomeFilterItem = (category, item) => {
        switch (category) {
            case 'industries': toggleIndustry(item); break
            case 'stages': toggleStage(item); break
            case 'locations': toggleLocation(item); break
            case 'teamSize': setTeamSize(item); break
            case 'funding': setFunding(item); break
            default: break
        }
    }

    const isHomeFilterActive = (category, item) => {
        switch (category) {
            case 'industries': return homeFilters.industries.includes(item)
            case 'stages': return homeFilters.stages.includes(item)
            case 'locations': return homeFilters.locations.includes(item)
            case 'teamSize': return homeFilters.teamSize === item
            case 'funding': return homeFilters.funding === item
            default: return false
        }
    }

    const toggleJobFilter = (id) => {
        setJobFilterError('')
        setSelectedJobFilters((prev) => {
            if (prev.includes(id)) {
                return prev.filter((f) => f !== id)
            }
            if (prev.length >= MAX_JOB_FILTERS) {
                setJobFilterError(`You can select up to ${MAX_JOB_FILTERS} filters`)
                return prev
            }
            return [...prev, id]
        })
    }

    const clearJobFilters = () => {
        setSelectedJobFilters([])
        setJobFilterError('')
    }

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

    const handleResultClick = async (type, item) => {
        if (!item) {
            console.error('Invalid item:', item)
            return
        }

        if (type === 'startup') {
            // Helper to check if string is a UUID
            const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

            // Check for profiles.username first (from search results), then owner_nickname, then fetch
            const ownerUsername = item.profiles?.username || item.owner_nickname
            if (ownerUsername && !isUUID(ownerUsername) && item.slug) {
                navigate(`/${ownerUsername}/startup/${item.slug}`)
            } else if (item.id) {
                navigate(`/startup/${item.id}`)
            } else {
                console.error('Startup ID is missing:', item)
            }
        } else if (type === 'profile') {
            // Check if it's current user's profile
            if (item.id === user?.id) {
                navigate('/profile')
            } else if (item.username) {
                // Navigate to public profile page using nickname
                navigate(`/profile/${item.username}`)
            } else if (item.id) {
                // Fallback to ID
                navigate(`/profile/${item.id}`)
            } else {
                console.error('Profile ID and username are missing:', item)
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
                        {(currentScreen === 'chat' || currentScreen === 'chat-detail') && (
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
                        {currentScreen === 'jobs' && (
                            <>
                                <p className="desktop-header-eyebrow">Job Scanner</p>
                                <h1>Find Jobs</h1>
                            </>
                        )}
                        {!['home', 'chat', 'chat-detail', 'saved', 'notifications', 'activity-dashboard', 'profile', 'settings', 'jobs'].includes(currentScreen) && (
                            <>
                                <p className="desktop-header-eyebrow">Innovation Hub</p>
                                <h1>Launch Your Startup</h1>
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
                                                                onClick={() => handleResultClick('startup', startup)}
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
                                                                onClick={() => handleResultClick('profile', profile)}
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
                            <div ref={homeFilterRef} style={{ overflow: 'visible' }}>
                                <button
                                    ref={homeFilterBtnRef}
                                    type="button"
                                    className="desktop-icon-btn desktop-filter-btn"
                                    onClick={() => {
                                        if (homeFilterBtnRef.current) {
                                            const rect = homeFilterBtnRef.current.getBoundingClientRect()
                                            setHomeFilterPos({
                                                top: rect.bottom + 12,
                                                right: window.innerWidth - rect.right,
                                            })
                                        }
                                        setIsHomeFilterOpen((open) => !open)
                                    }}
                                    title="Filters"
                                >
                                    <i className="fa-solid fa-filter"></i>
                                    {activeFiltersCount > 0 && (
                                        <span className="desktop-filter-badge">{activeFiltersCount}</span>
                                    )}
                                </button>
                            </div>
                        )}
                        {currentScreen === 'jobs' && (
                            <div ref={jobFilterRef} style={{ overflow: 'visible' }}>
                                <button
                                    ref={jobFilterBtnRef}
                                    type="button"
                                    className="desktop-icon-btn desktop-filter-btn"
                                    onClick={() => {
                                        if (jobFilterBtnRef.current) {
                                            const rect = jobFilterBtnRef.current.getBoundingClientRect()
                                            setJobFilterPos({
                                                top: rect.bottom + 12,
                                                right: window.innerWidth - rect.right,
                                            })
                                        }
                                        setIsJobFilterOpen((open) => !open)
                                    }}
                                    title="Job filters"
                                >
                                    <i className="fa-solid fa-filter"></i>
                                    {selectedJobFilters.length > 0 && (
                                        <span className="desktop-filter-badge">{selectedJobFilters.length}</span>
                                    )}
                                </button>
                            </div>
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

                <main className="desktop-content-area" style={{ overflow: 'visible' }}>
                    {children}
                </main>
            </div>

            {/* Home filter popover — rendered as fixed overlay so overflow:hidden parents can't clip it */}
            {isHomeFilterOpen && (
                <div
                    ref={(el) => {
                        if (el) homeFilterRef.current = el
                    }}
                    className="fixed w-[340px] rounded-3xl border border-white/10 bg-bg-primary/70 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
                    style={{
                        top: homeFilterPos.top,
                        right: homeFilterPos.right,
                        zIndex: 999999,
                    }}
                >
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Filter startups</p>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Narrow down your feed.
                            </p>
                        </div>
                        {activeFiltersCount > 0 && (
                            <button
                                type="button"
                                onClick={clearHomeFilters}
                                className="text-[11px] font-medium text-[#5a8ceb] hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-white/10 px-1 gap-0.5 scrollbar-hide">
                        {Object.entries(HOME_FILTER_DATA).map(([key, cat]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveHomeTab(key)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${activeHomeTab === key
                                    ? 'border-[#5a8ceb] text-[#5a8ceb]'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <i className={`${cat.icon} text-[10px]`}></i>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Active filter tags */}
                    {activeFiltersCount > 0 && (
                        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                            {homeFilters.industries.map((item) => (
                                <span key={item} className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                    <span>{item}</span>
                                    <button type="button" onClick={() => toggleIndustry(item)} className="hover:text-[#5a8ceb]/70">×</button>
                                </span>
                            ))}
                            {homeFilters.stages.map((item) => (
                                <span key={item} className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                    <span>{item}</span>
                                    <button type="button" onClick={() => toggleStage(item)} className="hover:text-[#5a8ceb]/70">×</button>
                                </span>
                            ))}
                            {homeFilters.locations.map((item) => (
                                <span key={item} className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                    <span>{item}</span>
                                    <button type="button" onClick={() => toggleLocation(item)} className="hover:text-[#5a8ceb]/70">×</button>
                                </span>
                            ))}
                            {homeFilters.teamSize && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                    <span>{homeFilters.teamSize}</span>
                                    <button type="button" onClick={() => setTeamSize(homeFilters.teamSize)} className="hover:text-[#5a8ceb]/70">×</button>
                                </span>
                            )}
                            {homeFilters.funding && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                    <span>{homeFilters.funding}</span>
                                    <button type="button" onClick={() => setFunding(homeFilters.funding)} className="hover:text-[#5a8ceb]/70">×</button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Filter items grid */}
                    <div className="max-h-64 overflow-y-auto px-3 pt-3 pb-3">
                        <div className="flex flex-wrap gap-2">
                            {HOME_FILTER_DATA[activeHomeTab]?.items.map((item) => {
                                const active = isHomeFilterActive(activeHomeTab, item)
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleHomeFilterItem(activeHomeTab, item)}
                                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${active
                                            ? 'border-[#5a8ceb] bg-[#5a8ceb]/20 text-[#5a8ceb] shadow-[0_0_0_1px_rgba(90,140,235,0.3)]'
                                            : 'border-white/8 bg-white/4 text-text-secondary hover:border-white/15 hover:bg-white/8 hover:text-text-primary'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-3 pt-2 border-t border-white/10 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setIsHomeFilterOpen(false)}
                            className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full bg-[#5a8ceb] text-white hover:bg-[#4a7cd4] transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Job filter popover — rendered as fixed overlay so overflow:hidden parents can't clip it */}
            {isJobFilterOpen && (
                <div
                    ref={(el) => {
                        // merge into jobFilterRef so outside-click detection still works
                        if (el) jobFilterRef.current = el
                    }}
                    className="fixed w-80 rounded-3xl border border-white/10 bg-bg-primary/70 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
                    style={{
                        top: jobFilterPos.top,
                        right: jobFilterPos.right,
                        zIndex: 999999,
                    }}
                >
                    <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Refine job matches</p>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Choose up to {MAX_JOB_FILTERS} smart filters.
                            </p>
                        </div>
                        {selectedJobFilters.length > 0 && (
                            <button
                                type="button"
                                onClick={clearJobFilters}
                                className="text-[11px] font-medium text-[#5a8ceb] hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {selectedJobFilters.length > 0 && (
                        <div className="px-4 pt-3 flex flex-wrap gap-2">
                            {selectedJobFilters.map((id) => {
                                const f = JOB_FILTER_OPTIONS.find((opt) => opt.id === id)
                                if (!f) return null
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1"
                                    >
                                        <span>{f.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleJobFilter(id)}
                                            className="hover:text-[#5a8ceb]/70"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )
                            })}
                        </div>
                    )}

                    <div className="max-h-80 overflow-y-auto px-2.5 pt-2 pb-3 space-y-1.5">
                        {JOB_FILTER_OPTIONS.map((filter) => {
                            const isActive = selectedJobFilters.includes(filter.id)
                            const isDisabled = !isActive && selectedJobFilters.length >= MAX_JOB_FILTERS

                            return (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => toggleJobFilter(filter.id)}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-2.5 py-2.5 rounded-xl transition-all duration-200 border ${isActive
                                        ? 'border-[#5a8ceb] bg-[#101827] shadow-[0_0_0_1px_rgba(90,140,235,0.4)]'
                                        : 'border-transparent hover:border-glass-border/80 hover:bg-bg-tertiary/80'
                                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs ${isActive
                                                ? 'bg-[#5a8ceb]/20 text-[#5a8ceb]'
                                                : 'bg-bg-tertiary text-text-secondary'
                                                }`}
                                        >
                                            <i className={filter.icon}></i>
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary'
                                                    }`}
                                            >
                                                {filter.label}
                                            </p>
                                            <p className="text-[11px] text-text-secondary mt-0.5">
                                                {filter.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="px-4 pb-3 pt-2 border-t border-white/10 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setIsJobFilterOpen(false)}
                            className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full bg-[#5a8ceb] text-white hover:bg-[#4a7cd4] transition-colors"
                        >
                            Done
                        </button>
                    </div>

                    {jobFilterError && (
                        <div className="px-4 pb-3">
                            <p className="text-[11px] text-accent-warning">{jobFilterError}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default DesktopLayout

