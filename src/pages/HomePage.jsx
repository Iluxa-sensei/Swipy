import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStartupsLazy, useSwipes, useAuth } from '../hooks'
import OnboardingTutorial from '../components/OnboardingTutorial'
import { searchService } from '../services/searchService'

const HomePageFixed = () => {
    const { user } = useAuth()
    const {
        startups,
        loading: startupsLoading,
        loadingMore,
        error: startupsError,
        hasMore,
        loadMore,
        refetch: refetchStartups,
    } = useStartupsLazy()
    const { likeStartup, passStartup, loading: swipesLoading } = useSwipes(user?.id)

    // State management
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [showTutorial, setShowTutorial] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const searchContainerRef = useRef(null)

    const cardRef = useRef(null)
    const lastTapRef = useRef(0)
    const navigate = useNavigate()

    // Use real data from Supabase only
    const displayStartups = startups || []

    // Get current startup
    const currentStartup = displayStartups[currentCardIndex]

    // Debug logging
    console.log('=== HomePageFixed Debug ===')
    console.log('user:', user)
    console.log('startups:', startups)
    console.log('startupsLoading:', startupsLoading)
    console.log('startupsError:', startupsError)
    console.log('displayStartups:', displayStartups)
    console.log('displayStartups.length:', displayStartups?.length)
    console.log('============================')

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

            // Require at least 2 characters for search
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

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        if (value.trim().length >= 2) {
            setShowSearchResults(true)
        } else {
            setShowSearchResults(false)
        }
    }

    const handleResultClick = async (type, item) => {
        if (type === 'startup') {
            // Helper to check if string is a UUID
            const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
            
            // Check for profiles.username first (from search results), then owner_nickname, then fetch
            const ownerUsername = item.profiles?.username || item.owner_nickname
            if (ownerUsername && !isUUID(ownerUsername) && item.slug) {
                navigate(`/${ownerUsername}/startup/${item.slug}`)
            } else if (item.id) {
                navigate(`/startup/${item.id}`)
            }
        } else if (type === 'profile') {
            if (item.id === user?.id) {
                navigate('/profile')
            } else if (item.username) {
                navigate(`/profile/${item.username}`)
            } else {
                navigate(`/profile/${item.id}`)
            }
        }
        setSearchQuery('')
        setShowSearchResults(false)
    }

    useEffect(() => {
        const tutorialCompleted = localStorage.getItem('tutorial-completed')
        if (!tutorialCompleted) {
            const timer = setTimeout(() => setShowTutorial(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    useEffect(() => {
        if (currentCardIndex >= displayStartups.length) {
            setCurrentCardIndex(0)
        }
    }, [currentCardIndex, displayStartups.length])

    useEffect(() => {
        resetCardStyles()
    }, [currentCardIndex])

    // Preload logic: load more startups when we're close to the end
    useEffect(() => {
        const displayStartups = startups || []
        // If we have less than 2 startups remaining and there are more to load, preload them
        if (currentCardIndex >= displayStartups.length - 2 && hasMore && !loadingMore && !startupsLoading) {
            console.log('Preloading more startups...', {
                currentCardIndex,
                displayStartupsLength: displayStartups.length,
                hasMore,
                loadingMore,
                startupsLoading
            })
            loadMore()
        }
    }, [currentCardIndex, startups, hasMore, loadingMore, loadMore, startupsLoading])

    // Function to extract main color from gradient
    const getGradientColor = (gradientClass) => {
        const gradientMap = {
            'bg-gradient-to-br from-blue-300 to-blue-700': '#1565c0',
            'bg-gradient-to-br from-pink-300 to-red-500': '#f093fb',
            'bg-gradient-to-br from-cyan-300 to-blue-500': '#4facfe',
            'bg-gradient-to-br from-green-300 to-teal-500': '#43e97b',
            'bg-gradient-to-br from-pink-400 to-yellow-400': '#fa709a',
            'bg-gradient-to-br from-teal-300 to-pink-300': '#a8edea',
            'bg-gradient-to-br from-pink-400 to-pink-200': '#ff9a9e',
            'bg-gradient-to-br from-orange-200 to-orange-400': '#ffecd2',
            'bg-gradient-to-br from-pink-400 to-orange-300': '#ff9a9e',
            'bg-gradient-to-br from-purple-400 to-pink-400': '#a18cd1'
        }
        return gradientMap[gradientClass] || '#2196f3'
    }

    // Function to reset card styles
    const resetCardStyles = () => {
        setOffset({ x: 0, y: 0 })
    }

    // Function for swipe right (like)
    const handleLike = async () => {
        setIsAnimating(true)
        setOffset({ x: 1000, y: 0 })

        setTimeout(async () => {
            try {
                if (user?.id && currentStartup?.id) {
                    console.log('Liking startup:', currentStartup.id, currentStartup.name)
                    await likeStartup(currentStartup.id)
                    console.log('Liked startup successfully')
                    // Keep startup in list - don't remove after swipe
                }
            } catch (error) {
                console.error('Error liking startup:', error)
            }

            setCurrentCardIndex(prev => prev + 1)
            setIsAnimating(false)
            setOffset({ x: 0, y: 0 })
        }, 400)
    }

    // Function for swipe left (pass)
    const handlePass = async () => {
        setIsAnimating(true)
        setOffset({ x: -1000, y: 0 })

        setTimeout(async () => {
            try {
                if (user?.id && currentStartup?.id) {
                    console.log('Passing startup:', currentStartup.id, currentStartup.name)
                    await passStartup(currentStartup.id)
                    console.log('Passed startup successfully')
                    // Keep startup in list - don't remove after swipe
                }
            } catch (error) {
                console.error('Error passing startup:', error)
            }

            setCurrentCardIndex(prev => prev + 1)
            setIsAnimating(false)
            setOffset({ x: 0, y: 0 })
        }, 400)
    }

    // Show loading state
    if (startupsLoading) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/filters')}>
                        <i className="fas fa-filter"></i>
                    </button>
                    <h1 className="text-3xl font-bold animate-super-gradient">
                        Swipy
                    </h1>
                    <button className="header-btn" onClick={() => navigate('/saved')}>
                        <i className="fas fa-bookmark"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="state-icon state-icon-blue animate-pulse">
                            <i className="fas fa-spinner fa-spin"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Startups</h2>
                        <p className="text-text-secondary">Please wait while we fetch the latest opportunities...</p>
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
                    <button className="header-btn" onClick={() => navigate('/filters')}>
                        <i className="fas fa-filter"></i>
                    </button>
                    <h1 className="text-3xl font-bold animate-super-gradient">
                        Swipy
                    </h1>
                    <button className="header-btn" onClick={() => navigate('/saved')}>
                        <i className="fas fa-bookmark"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="state-icon state-icon-red">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Startups</h2>
                        <p className="text-text-secondary mb-6">{startupsError}</p>
                        <button
                            className="btn-icon-style px-8 py-3 rounded-2xl font-semibold"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // If reached end of startups list
    if (currentCardIndex >= displayStartups.length) {
        // Show loading if we're still loading more startups
        if (loadingMore) {
            return (
                <div className="screen active">
                    <div className="header">
                        <button className="header-btn" onClick={() => navigate('/filters')}>
                            <i className="fas fa-filter"></i>
                        </button>
                        <h1 className="text-3xl font-bold animate-super-gradient">Swipy</h1>
                        <button className="header-btn" onClick={() => navigate('/saved')}>
                            <i className="fas fa-bookmark"></i>
                        </button>
                    </div>

                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="state-icon state-icon-blue animate-pulse">
                                <i className="fas fa-spinner fa-spin"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Loading More Startups</h2>
                            <p className="text-text-secondary">Finding more opportunities for you...</p>
                        </div>
                    </div>
                </div>
            )
        }

        // Try to load more if available
        if (hasMore && !loadingMore) {
            loadMore()
        }

        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/filters')}>
                        <i className="fas fa-filter"></i>
                    </button>
                    <h1 className="text-3xl font-bold animate-super-gradient">Swipy</h1>
                    <button className="header-btn" onClick={() => navigate('/saved')}>
                        <i className="fas fa-bookmark"></i>
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="state-icon state-icon-blue animate-float animate-glow">
                            <i className="fas fa-heart"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">
                            {hasMore ? 'Loading More...' : 'No More Startups'}
                        </h2>
                        <p className="text-text-secondary mb-6">
                            {hasMore
                                ? 'Loading more startup opportunities for you...'
                                : 'You\'ve seen all available startups. Check back later for new opportunities!'
                            }
                        </p>
                        {hasMore && (
                            <button
                                className="btn-primary hover:scale-105 transition-transform duration-200"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                <i className={`fas ${loadingMore ? 'fa-spinner fa-spin' : 'fa-refresh'}`}></i>
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        )}
                        {!hasMore && (
                            <button
                                className="btn-primary hover:scale-105 transition-transform duration-200"
                                onClick={() => setCurrentCardIndex(0)}
                            >
                                <i className="fas fa-refresh"></i>
                                Refresh
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active flex flex-col">
            {/* Mobile Search Bar */}
            <div className="mobile-search-container" ref={searchContainerRef}>
                <div className="mobile-search-bar">
                    <i className="fas fa-search mobile-search-icon"></i>
                    <input
                        type="search"
                        placeholder="Search startups or @users..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                        className="mobile-search-input"
                    />
                    {isSearching && (
                        <i className="fas fa-spinner fa-spin mobile-search-spinner"></i>
                    )}
                    {searchQuery && !isSearching && (
                        <button
                            className="mobile-search-clear"
                            onClick={() => {
                                setSearchQuery('')
                                setShowSearchResults(false)
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery.trim().length >= 2 && (
                    <div className="mobile-search-results">
                        {isSearching ? (
                            <div className="mobile-search-empty">
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>Searching...</span>
                            </div>
                        ) : searchResults.startups.length === 0 && searchResults.profiles.length === 0 ? (
                            <div className="mobile-search-empty">
                                <i className="fas fa-search"></i>
                                <span>No results found</span>
                            </div>
                        ) : (
                            <>
                                {searchResults.startups.length > 0 && (
                                    <div className="mobile-search-section">
                                        <div className="mobile-search-section-header">
                                            <i className="fas fa-rocket"></i>
                                            <span>Startups</span>
                                        </div>
                                        {searchResults.startups.map(startup => (
                                            <div
                                                key={startup.id}
                                                className="mobile-search-result-item"
                                                onClick={() => handleResultClick('startup', startup)}
                                            >
                                                <div className="mobile-search-result-avatar">
                                                    {startup.logo_url ? (
                                                        <img src={startup.logo_url} alt={startup.name} />
                                                    ) : (
                                                        <div className={`mobile-search-result-fallback ${startup.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'}`}>
                                                            <span>{startup.logo || startup.name?.[0] || 'S'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mobile-search-result-info">
                                                    <div className="mobile-search-result-name">{startup.name}</div>
                                                    <div className="mobile-search-result-meta">
                                                        {startup.industry && <span>{startup.industry}</span>}
                                                        {startup.stage && <span>{startup.stage}</span>}
                                                    </div>
                                                </div>
                                                <i className="fas fa-chevron-right mobile-search-result-arrow"></i>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.profiles.length > 0 && (
                                    <div className="mobile-search-section">
                                        <div className="mobile-search-section-header">
                                            <i className="fas fa-user"></i>
                                            <span>People</span>
                                        </div>
                                        {searchResults.profiles.map(profile => (
                                            <div
                                                key={profile.id}
                                                className="mobile-search-result-item"
                                                onClick={() => handleResultClick('profile', profile)}
                                            >
                                                <div className="mobile-search-result-avatar">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt={profile.full_name || profile.username} />
                                                    ) : (
                                                        <div className="mobile-search-result-fallback bg-gradient-to-br from-blue-300 to-blue-700">
                                                            <span>{(profile.full_name || profile.username || 'U')?.[0]?.toUpperCase() || '?'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mobile-search-result-info">
                                                    <div className="mobile-search-result-name">
                                                        {profile.full_name || profile.username || 'User'}
                                                        {profile.username && <span className="mobile-search-result-username">@{profile.username}</span>}
                                                    </div>
                                                    {profile.role && (
                                                        <div className="mobile-search-result-meta">
                                                            <span>{profile.role}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <i className="fas fa-chevron-right mobile-search-result-arrow"></i>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="header">
                <button className="header-btn" onClick={() => navigate('/filters')}>
                    <i className="fas fa-filter"></i>
                </button>
                <h1 className="text-3xl font-bold animate-super-gradient">
                    Swipy
                </h1>
                <button className="header-btn" onClick={() => navigate('/saved')}>
                    <i className="fas fa-bookmark"></i>
                </button>
            </div>

            <div className="swipe-container flex-1 w-full flex items-start justify-center overflow-hidden px-2 pt-2">
                <div className="card-stack relative w-full max-w-[480px] aspect-[3/6] max-h-full">
                    {/* Back card (next) */}
                    {currentCardIndex + 1 < displayStartups.length && (
                        <div
                            className="startup-card-container"
                            style={{
                                opacity: 0.1,
                                scale: '0.96',
                                zIndex: 1,
                                transition: 'all 0.4s ease-out',
                                borderRadius: '32px'
                            }}
                        >
                            <div className="startup-card overflow-hidden rounded-[32px] border border-glass-border bg-glass-bg h-full">
                                <div className="card-image h-[35%]">
                                    <div className={`${displayStartups[currentCardIndex + 1].gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} w-full h-full relative`}>
                                        <div className="company-logo">
                                            <span className="text-white font-bold text-2xl">{displayStartups[currentCardIndex + 1].logo || displayStartups[currentCardIndex + 1].name?.[0] || 'S'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content p-6">
                                    <h3 className="text-xl font-bold text-text-primary mb-1">{displayStartups[currentCardIndex + 1].name}</h3>
                                    <div className="flex items-center gap-2 text-text-secondary text-xs">
                                        <span>{displayStartups[currentCardIndex + 1].location || 'Remote'}</span>
                                        <span>•</span>
                                        <span>{displayStartups[currentCardIndex + 1].industry || 'Technology'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main card */}
                    <div
                        ref={cardRef}
                        className={`startup-card-container ${isDragging ? 'isDragging' : ''}`}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                            transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            zIndex: 10,
                            position: 'relative',
                            touchAction: 'none',
                            borderRadius: '32px',
                            transform: `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${offset.x * 0.1}deg) scale(${isDragging ? 1.02 : 1})`,
                            boxShadow: offset.x > 40 ? `0 0 50px rgba(34, 197, 94, ${Math.min(0.6, Math.abs(offset.x) / 300)})` :
                                offset.x < -40 ? `0 0 50px rgba(239, 68, 68, ${Math.min(0.6, Math.abs(offset.x) / 300)})` :
                                    offset.y > 60 ? `0 0 50px rgba(59, 130, 246, ${Math.min(0.6, Math.abs(offset.y) / 300)})` :
                                        '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                        onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId)
                            setStartPos({ x: e.clientX, y: e.clientY })
                            setOffset({ x: 0, y: 0 })
                            setIsDragging(false)
                        }}
                        onPointerMove={(e) => {
                            if (!isDragging) {
                                const deltaX = e.clientX - startPos.x
                                const deltaY = e.clientY - startPos.y
                                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
                                if (distance > 5) {
                                    setIsDragging(true)
                                }
                                return
                            }

                            const deltaX = e.clientX - startPos.x
                            const deltaY = e.clientY - startPos.y
                            setOffset({ x: deltaX, y: deltaY })
                        }}
                        onPointerUp={(e) => {
                            if (!isDragging) return
                            setIsDragging(false)
                            
                            const deltaX = offset.x
                            const deltaY = offset.y

                            if (deltaX > 100) {
                                handleLike()
                            } else if (deltaX < -100) {
                                handlePass()
                            } else if (deltaY > 120) {
                                // Down for details
                                if (currentStartup.owner_nickname && currentStartup.slug) {
                                    navigate(`/${currentStartup.owner_nickname}/startup/${currentStartup.slug}`)
                                } else {
                                    navigate(`/startup/${currentStartup.id}`)
                                }
                            } else {
                                // Reset
                                setOffset({ x: 0, y: 0 })
                            }
                        }}
                    >
                        <div className="startup-card h-full w-full rounded-[32px] overflow-hidden border border-glass-border bg-glass-bg shadow-2xl relative flex flex-col">
                            {/* Image Section - Reduced height */}
                            <div className="relative h-[35%] w-full overflow-hidden">
                                <div className={`${currentStartup.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} w-full h-full relative`}>
                                    <div className="company-logo">
                                        {currentStartup.logo_url ? (
                                            <img src={currentStartup.logo_url} alt={currentStartup.name} className="w-16 h-16 object-contain rounded-2xl shadow-xl bg-white/10 p-2" />
                                        ) : (
                                            <span className="text-white font-bold text-4xl drop-shadow-lg">{currentStartup.logo || currentStartup.name?.[0] || 'S'}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    
                                    {/* Badges on image */}
                                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider">
                                            {currentStartup.funding || currentStartup.funding_round || 'Seed'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider">
                                            {currentStartup.stage || 'Early Stage'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section - Increased About space */}
                            <div className="p-6 flex-1 flex flex-col bg-glass-bg backdrop-blur-xl overflow-hidden">
                                <div className="flex flex-col mb-4 px-1">
                                    <h3 className="text-3xl font-black text-text-primary tracking-tight truncate mb-2">{currentStartup.name}</h3>
                                    <div className="flex items-center gap-4 text-text-secondary text-sm font-semibold">
                                        <div className="flex items-center gap-1.5">
                                            <i className="fas fa-location-dot text-accent-primary text-xs"></i>
                                            <span>{currentStartup.location || 'Remote'}</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                                        <div className="flex items-center gap-1.5">
                                            <i className="fas fa-users text-accent-primary text-xs"></i>
                                            <span>{currentStartup.teamSize || currentStartup.team_size || '5-10'} employees</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        {currentStartup.description}
                                    </p>
                                </div>
                            </div>

                            {/* Pull indicator */}
                            <div className="h-1.5 w-12 bg-white/10 rounded-full mx-auto my-3 flex-shrink-0"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tutorial Modal */}
            {showTutorial && (
                <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
            )}
        </div>
    )
}

export default HomePageFixed
