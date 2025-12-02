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
        removeStartupFromList
    } = useStartupsLazy()
    const { likeStartup, passStartup, loading: swipesLoading } = useSwipes(user?.id)

    // State management
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
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

    const handleResultClick = (type, id) => {
        if (type === 'startup') {
            navigate(`/startup/${id}`)
        } else if (type === 'profile') {
            if (id === user?.id) {
                navigate('/profile')
            } else {
                navigate(`/profile/${id}`)
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
        setIsFlipped(false)
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
        if (cardRef.current) {
            cardRef.current.style.transition = ''
            cardRef.current.style.transform = 'translateY(0px)'
            cardRef.current.style.opacity = ''
            cardRef.current.style.boxShadow = ''
        }
    }

    // Function for swipe right (like)
    const handleLike = async () => {
        if (!cardRef.current || isAnimating) return
        setIsAnimating(true)

        cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        cardRef.current.style.transform = 'translateX(1000px) rotate(30deg) scale(0.8)'
        cardRef.current.style.opacity = '0'
        cardRef.current.style.boxShadow = ''

        setTimeout(async () => {
            try {
                if (user?.id && currentStartup?.id) {
                    console.log('Liking startup:', currentStartup.id, currentStartup.name)
                    await likeStartup(currentStartup.id)
                    console.log('Liked startup successfully, removing from list')
                    // Remove the startup from current list to prevent duplicates
                    removeStartupFromList(currentStartup.id)
                    console.log('Removed startup from list')
                }
            } catch (error) {
                console.error('Error liking startup:', error)
            }

            setCurrentCardIndex(prev => prev + 1)
            setIsAnimating(false)
            resetCardStyles()
        }, 400)
    }

    // Function for swipe left (pass)
    const handlePass = async () => {
        if (!cardRef.current || isAnimating) return
        setIsAnimating(true)

        cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        cardRef.current.style.transform = 'translateX(-1000px) rotate(-30deg) scale(0.8)'
        cardRef.current.style.opacity = '0'
        cardRef.current.style.boxShadow = ''

        setTimeout(async () => {
            try {
                if (user?.id && currentStartup?.id) {
                    console.log('Passing startup:', currentStartup.id, currentStartup.name)
                    await passStartup(currentStartup.id)
                    console.log('Passed startup successfully, removing from list')
                    // Remove the startup from current list to prevent duplicates
                    removeStartupFromList(currentStartup.id)
                    console.log('Removed startup from list')
                }
            } catch (error) {
                console.error('Error passing startup:', error)
            }

            setCurrentCardIndex(prev => prev + 1)
            setIsAnimating(false)
            resetCardStyles()
        }, 400)
    }

    // Function to handle double tap
    const handleCardClick = (e) => {
        e.stopPropagation()
        e.preventDefault()

        if (isDragging) return

        const currentTime = Date.now()
        const timeSinceLastTap = currentTime - lastTapRef.current

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            setIsFlipped(prev => !prev)
            lastTapRef.current = 0
        } else {
            lastTapRef.current = currentTime
        }
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
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
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
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Startups</h2>
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
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
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
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float animate-glow">
                            <i className="fas fa-heart text-3xl text-white"></i>
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
        <div className="screen active">
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
                                                onClick={() => handleResultClick('startup', startup.id)}
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
                                                onClick={() => handleResultClick('profile', profile.id)}
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

            <div className="swipe-container">
                <div className="card-stack">
                    {/* Back card (next) */}
                    {currentCardIndex + 1 < displayStartups.length && (
                        <div
                            className="startup-card-container"
                            style={{
                                opacity: 0.15,
                                scale: '0.92',
                                zIndex: 1,
                                transition: 'all 0.4s ease-out'
                            }}
                        >
                            <div className="startup-card">
                                <div className="card-image">
                                    <div className={`${displayStartups[currentCardIndex + 1].gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} w-full h-full relative overflow-hidden`}>
                                        <div className="company-logo">
                                            <span className="text-white font-bold text-xl">{displayStartups[currentCardIndex + 1].logo || 'S'}</span>
                                        </div>
                                        <div className="gradient-overlay opacity-70"></div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title">{displayStartups[currentCardIndex + 1].name}</h3>
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
                            transition: isDragging ? 'none' : 'all 0.3s ease',
                            zIndex: 10,
                            perspective: '1000px',
                            position: 'relative'
                        }}
                        onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId)
                            setStartPos({ x: e.clientX, y: e.clientY })
                            setCurrentPos({ x: e.clientX, y: e.clientY })
                            setIsDragging(false)
                            if (cardRef.current) {
                                cardRef.current.style.transition = 'none'
                            }
                        }}
                        onPointerMove={(e) => {
                            const deltaX = e.clientX - startPos.x
                            const deltaY = e.clientY - startPos.y
                            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

                            if (!isDragging && distance > 10) {
                                setIsDragging(true)
                            }

                            if (isDragging && cardRef.current) {
                                const rotation = deltaX * 0.15
                                const scale = Math.max(0.8, 1 - Math.abs(deltaX) / 1000)

                                const cardContainer = cardRef.current
                                cardContainer.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg) scale(${scale})`

                                if (deltaX > 50) {
                                    cardContainer.style.boxShadow = `0 0 30px rgba(34, 197, 94, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                                    cardContainer.style.borderRadius = '24px'
                                } else if (deltaX < -50) {
                                    cardContainer.style.boxShadow = `0 0 30px rgba(239, 68, 68, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                                    cardContainer.style.borderRadius = '24px'
                                } else {
                                    cardContainer.style.boxShadow = ''
                                    cardContainer.style.borderRadius = '24px'
                                }

                                setCurrentPos({ x: e.clientX, y: e.clientY })
                            }
                        }}
                        onClick={handleCardClick}
                        onPointerUp={(e) => {
                            const deltaX = currentPos.x - startPos.x
                            const deltaY = currentPos.y - startPos.y

                            if (isDragging && cardRef.current) {
                                setIsDragging(false)
                                const cardContainer = cardRef.current

                                if (Math.abs(deltaX) > 80) {
                                    if (deltaX > 0) {
                                        handleLike()
                                    } else {
                                        handlePass()
                                    }
                                } else if (Math.abs(deltaY) > 100) {
                                    if (deltaY > 0) {
                                        cardContainer.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                                        cardContainer.style.transform = 'translateY(100vh) rotate(10deg) scale(0.8)'
                                        cardContainer.style.opacity = '0'
                                        cardContainer.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)'
                                        cardContainer.style.borderRadius = '24px'
                                        setTimeout(() => {
                                            navigate(`/startup/${currentStartup.id}`)
                                        }, 400)
                                    } else {
                                        cardContainer.style.transition = 'all 0.3s ease'
                                        cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                                        cardContainer.style.boxShadow = 'none'
                                        cardContainer.style.borderRadius = '24px'
                                    }
                                } else {
                                    cardContainer.style.transition = 'all 0.3s ease'
                                    cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                                    cardContainer.style.boxShadow = 'none'
                                    cardContainer.style.borderRadius = '24px'
                                }
                            }
                        }}
                    >
                        {/* Flip Container */}
                        <div className={`flip-container ${isFlipped ? 'flipped' : ''}`}>
                            {/* Front Side */}
                            <div className="flip-front startup-card">
                                <div className="card-image">
                                    <div className={`${currentStartup.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} w-full h-full relative overflow-hidden`}>
                                        <div className="company-logo">
                                            <span className="text-white font-bold text-xl">{currentStartup.logo || 'S'}</span>
                                        </div>
                                        <div className="gradient-overlay"></div>
                                        <div className="card-badges">
                                            <span
                                                className="badge funding"
                                                style={{
                                                    backgroundColor: getGradientColor(currentStartup.gradient),
                                                    color: 'white'
                                                }}
                                            >
                                                {currentStartup.funding || currentStartup.funding_round || 'Seed'}
                                            </span>
                                            <span
                                                className="badge stage"
                                                style={{
                                                    backgroundColor: getGradientColor(currentStartup.gradient),
                                                    color: 'white'
                                                }}
                                            >
                                                {currentStartup.stage || 'Early Stage'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title">{currentStartup.name}</h3>
                                        <div className="card-meta">
                                            <span className="card-category">{currentStartup.category || currentStartup.industry || 'Technology'}</span>
                                            <span className="card-location">{currentStartup.location || 'Remote'}</span>
                                            <span className="card-team-size flex items-center gap-1">
                                                <i className="fas fa-users text-xs"></i>
                                                {currentStartup.teamSize || currentStartup.team_size || '5-10'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="card-description">{currentStartup.description}</p>
                                </div>

                            </div>

                            {/* Back Side */}
                            <div className="flip-back startup-card bg-bg-primary border border-glass-border">
                                {/* Header */}
                                <div className="p-4 border-b border-glass-border">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${getGradientColor(currentStartup.gradient)}20`,
                                            }}
                                        >
                                            <span
                                                className="font-bold text-lg"
                                                style={{ color: getGradientColor(currentStartup.gradient) }}
                                            >
                                                {currentStartup.logo || 'S'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-text-primary mb-1">{currentStartup.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                <span className="flex items-center gap-1">
                                                    <i
                                                        className="fas fa-tag"
                                                        style={{ color: getGradientColor(currentStartup.gradient) }}
                                                    ></i>
                                                    {currentStartup.category || currentStartup.industry || 'Technology'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <i
                                                        className="fas fa-chart-line"
                                                        style={{ color: getGradientColor(currentStartup.gradient) }}
                                                    ></i>
                                                    {currentStartup.stage || 'Early Stage'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                                    {/* About */}
                                    <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                                        <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                                            <i
                                                className="fas fa-info-circle"
                                                style={{ color: getGradientColor(currentStartup.gradient) }}
                                            ></i>
                                            About
                                        </h4>
                                        <p className="text-text-secondary text-sm leading-relaxed">{currentStartup.description}</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                                            <div
                                                className="font-bold text-lg"
                                                style={{ color: getGradientColor(currentStartup.gradient) }}
                                            >
                                                {currentStartup.funding || currentStartup.funding_round || 'Seed'}
                                            </div>
                                            <div className="text-text-secondary text-xs mt-1">Funding</div>
                                        </div>
                                        <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                                            <div
                                                className="font-bold text-lg flex items-center justify-center gap-2"
                                                style={{ color: getGradientColor(currentStartup.gradient) }}
                                            >
                                                <i className="fas fa-users text-sm"></i>
                                                {currentStartup.teamSize || currentStartup.team_size || '5-10'}
                                            </div>
                                            <div className="text-text-secondary text-xs mt-1">Team Size</div>
                                        </div>
                                    </div>

                                    {/* Investment Required */}
                                    {currentStartup.investment_required && (
                                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                                            <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                                                <i
                                                    className="fas fa-dollar-sign"
                                                    style={{ color: getGradientColor(currentStartup.gradient) }}
                                                ></i>
                                                Investment Required
                                            </h4>
                                            <div className="text-center space-y-2">
                                                <div
                                                    className="px-4 py-2 rounded-lg text-lg font-bold"
                                                    style={{
                                                        backgroundColor: `${getGradientColor(currentStartup.gradient)}20`,
                                                        color: getGradientColor(currentStartup.gradient),
                                                        border: `1px solid ${getGradientColor(currentStartup.gradient)}30`
                                                    }}
                                                >
                                                    ${currentStartup.investment_required}
                                                </div>
                                                {currentStartup.investment_percentage && (
                                                    <div className="text-sm text-white/80">
                                                        for {currentStartup.investment_percentage}% of company
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* EBITDA */}
                                    {currentStartup.ebitda && (
                                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                                            <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                                                <i
                                                    className="fas fa-chart-line"
                                                    style={{ color: getGradientColor(currentStartup.gradient) }}
                                                ></i>
                                                EBITDA
                                            </h4>
                                            <div className="text-center">
                                                <span
                                                    className="px-4 py-2 rounded-lg text-lg font-bold"
                                                    style={{
                                                        backgroundColor: `${getGradientColor(currentStartup.gradient)}20`,
                                                        color: getGradientColor(currentStartup.gradient),
                                                        border: `1px solid ${getGradientColor(currentStartup.gradient)}30`
                                                    }}
                                                >
                                                    ${currentStartup.ebitda}/month
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Location & Contact */}
                                    {(currentStartup.location || currentStartup.website) && (
                                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                                            <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                                                <i
                                                    className="fas fa-map-marker-alt"
                                                    style={{ color: getGradientColor(currentStartup.gradient) }}
                                                ></i>
                                                Details
                                            </h4>
                                            <div className="space-y-2">
                                                {currentStartup.location && (
                                                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                        <i
                                                            className="fas fa-map-marker-alt w-4"
                                                            style={{ color: getGradientColor(currentStartup.gradient) }}
                                                        ></i>
                                                        <span>{currentStartup.location}</span>
                                                    </div>
                                                )}
                                                {currentStartup.website && (
                                                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                        <i
                                                            className="fas fa-globe w-4"
                                                            style={{ color: getGradientColor(currentStartup.gradient) }}
                                                        ></i>
                                                        <span className="truncate">{currentStartup.website}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-glass-border">
                                    <button
                                        className="w-full text-text-secondary hover:text-blue-700 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setIsFlipped(false)
                                        }}
                                    >
                                        <i className="fas fa-undo"></i>
                                        Tap to flip back
                                    </button>
                                </div>
                            </div>
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
