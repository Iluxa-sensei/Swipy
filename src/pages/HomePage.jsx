import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useStartupsLazy, useSwipes, useAuth } from '../hooks'
import OnboardingTutorial from '../components/OnboardingTutorial'
import { searchService } from '../services/searchService'
import { profileService } from '../services/profileService.js'
import { isTutorialCompletedLocally, markTutorialCompletedLocally } from '../utils/tutorialStorage.js'

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
    const dragStartRef = useRef({ x: 0, y: 0 })
    const dragDeltaRef = useRef({ x: 0, y: 0 })
    const dragActiveRef = useRef(false)
    const [showTutorial, setShowTutorial] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const searchFieldRef = useRef(null)
    const searchDropdownRef = useRef(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const cardRef = useRef(null)
    const detailsPullIndicatorRef = useRef(null)
    const lastTapRef = useRef(0)
    const navigate = useNavigate()

    const displayStartups = startups || []

    // Get current startup
    const currentStartup = displayStartups[currentCardIndex]

    // Search functionality — same as desktop: API search, dropdown results, cards unchanged
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
                    const profiles = await searchService.searchProfiles(searchTerm, 5)
                    setSearchResults({ startups: [], profiles })
                } else {
                    const [startupResults, profiles] = await Promise.all([
                        searchService.searchStartups(searchTerm, 5),
                        searchService.searchProfiles(searchTerm, 5),
                    ])
                    setSearchResults({ startups: startupResults, profiles })
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

    const syncDropdownPosition = useCallback(() => {
        if (!searchFieldRef.current) return
        const rect = searchFieldRef.current.getBoundingClientRect()
        setDropdownPosition({
            top: rect.bottom + 8,
            left: 12,
            width: window.innerWidth - 24,
        })
    }, [])

    useLayoutEffect(() => {
        const shouldShow = (showSearchResults || isSearching) && searchQuery.trim().length >= 2
        if (shouldShow) {
            syncDropdownPosition()
        }
    }, [showSearchResults, isSearching, searchQuery, syncDropdownPosition])

    useEffect(() => {
        const shouldShow = (showSearchResults || isSearching) && searchQuery.trim().length >= 2
        if (!shouldShow) return

        window.addEventListener('resize', syncDropdownPosition)
        window.addEventListener('scroll', syncDropdownPosition, true)

        return () => {
            window.removeEventListener('resize', syncDropdownPosition)
            window.removeEventListener('scroll', syncDropdownPosition, true)
        }
    }, [showSearchResults, isSearching, searchQuery, syncDropdownPosition])

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const inField = searchFieldRef.current?.contains(event.target)
            const inDropdown = searchDropdownRef.current?.contains(event.target)
            if (!inField && !inDropdown) {
                setShowSearchResults(false)
            }
        }

        document.addEventListener('pointerdown', handleClickOutside)
        return () => {
            document.removeEventListener('pointerdown', handleClickOutside)
        }
    }, [])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        if (value.trim().length >= 2) {
            setShowSearchResults(true)
            syncDropdownPosition()
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
        if (!user?.id) return

        let cancelled = false
        let timer

        const checkTutorial = async () => {
            if (isTutorialCompletedLocally(user.id)) return

            // Migrate legacy global key from before per-user storage
            try {
                if (localStorage.getItem('tutorial-completed') === 'true') {
                    markTutorialCompletedLocally(user.id)
                    profileService.markTutorialCompleted(user.id)
                    return
                }
            } catch {
                // ignore
            }

            const profile = await profileService.getProfile(user.id)
            if (cancelled) return

            if (profile?.tutorial_completed) {
                markTutorialCompletedLocally(user.id)
                return
            }

            timer = setTimeout(() => setShowTutorial(true), 1000)
        }

        checkTutorial()

        return () => {
            cancelled = true
            if (timer) clearTimeout(timer)
        }
    }, [user?.id])

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
        const list = startups || []
        if (currentCardIndex >= list.length - 2 && hasMore && !loadingMore && !startupsLoading) {
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
            cardRef.current.style.transition = 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            cardRef.current.style.transform = 'translateX(0px) translateY(0px) rotate(0deg) scale(1)'
            cardRef.current.style.opacity = ''
            cardRef.current.style.boxShadow = ''
        }
        if (detailsPullIndicatorRef.current) {
            detailsPullIndicatorRef.current.style.opacity = '0'
            detailsPullIndicatorRef.current.style.transform = 'translate(-50%, 0px) scale(0.98)'
        }
        dragDeltaRef.current = { x: 0, y: 0 }
        dragActiveRef.current = false
        setIsDragging(false)
    }

    // Function for swipe right (like)
    const handleLike = async () => {
        if (!cardRef.current || isAnimating || !currentStartup?.id) return
        setIsAnimating(true)

        cardRef.current.style.transition = 'transform 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 200ms ease'
        cardRef.current.style.transform = 'translateX(1000px) rotate(30deg) scale(0.8)'
        cardRef.current.style.opacity = '0'
        cardRef.current.style.boxShadow = ''
        dragActiveRef.current = false
        setIsDragging(false)

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
            resetCardStyles()
        }, 400)
    }

    // Function for swipe left (pass)
    const handlePass = async () => {
        if (!cardRef.current || isAnimating || !currentStartup?.id) return
        setIsAnimating(true)

        cardRef.current.style.transition = 'transform 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 200ms ease'
        cardRef.current.style.transform = 'translateX(-1000px) rotate(-30deg) scale(0.8)'
        cardRef.current.style.opacity = '0'
        cardRef.current.style.boxShadow = ''
        dragActiveRef.current = false
        setIsDragging(false)

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
            resetCardStyles()
        }, 400)
    }

    const renderSearchDropdown = () => {
        const shouldShow = (showSearchResults || isSearching) && searchQuery.trim().length >= 2
        if (!shouldShow) return null

        return createPortal(
            <div
                ref={searchDropdownRef}
                className="mobile-search-results"
                style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    zIndex: 99999,
                }}
            >
                {isSearching ? (
                    <div className="mobile-search-empty">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Searching...</span>
                    </div>
                ) : searchResults.startups.length === 0 && searchResults.profiles.length === 0 ? (
                    <div className="mobile-search-empty">
                        <i className="fas fa-search"></i>
                        <span>No results for &ldquo;{searchQuery.trim()}&rdquo;</span>
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
            </div>,
            document.body
        )
    }

    const renderMobileToolbar = () => (
        <>
            <div className="mobile-home-toolbar">
                <div className="mobile-search-field" ref={searchFieldRef}>
                    <div className="mobile-search-bar">
                        <i className="fas fa-search mobile-search-icon"></i>
                        <input
                            type="search"
                            placeholder="Search startups or @users..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                syncDropdownPosition()
                                if (searchQuery.trim().length >= 2) setShowSearchResults(true)
                            }}
                            className="mobile-search-input"
                        />
                        {isSearching && (
                            <i className="fas fa-spinner fa-spin mobile-search-spinner"></i>
                        )}
                        {searchQuery && !isSearching && (
                            <button
                                type="button"
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
                </div>

                <button type="button" className="mobile-toolbar-btn" onClick={() => navigate('/filters')} aria-label="Filters">
                    <i className="fas fa-filter"></i>
                </button>

                <button type="button" className="mobile-toolbar-btn" onClick={() => navigate('/saved')} aria-label="Saved">
                    <i className="fas fa-bookmark"></i>
                </button>
            </div>
            {renderSearchDropdown()}
        </>
    )

    // Show loading state
    if (startupsLoading) {
        return (
            <div className="screen active">
                {renderMobileToolbar()}

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
                {renderMobileToolbar()}

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
                    {renderMobileToolbar()}

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
                {renderMobileToolbar()}

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
                                : 'You\'ve seen all available startups. Check back later for new opportunities!'}
                        </p>
                        {hasMore && (
                            <button
                                type="button"
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
                                type="button"
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
            {renderMobileToolbar()}

            <div className="swipe-container flex-1 w-full flex items-start justify-center overflow-hidden px-2 pt-1">
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
                            transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 300ms ease',
                            zIndex: 10,
                            position: 'relative',
                            touchAction: 'none',
                            borderRadius: '32px',
                        }}
                        onPointerDown={(e) => {
                            if (isAnimating) return
                            e.currentTarget.setPointerCapture(e.pointerId)
                            e.preventDefault()
                            dragStartRef.current = { x: e.clientX, y: e.clientY }
                            dragDeltaRef.current = { x: 0, y: 0 }
                            dragActiveRef.current = false
                            setIsDragging(false)

                            if (detailsPullIndicatorRef.current) {
                                detailsPullIndicatorRef.current.style.opacity = '0'
                                detailsPullIndicatorRef.current.style.transform = 'translate(-50%, 0px) scale(0.98)'
                            }

                            if (cardRef.current) {
                                cardRef.current.style.transition = 'none'
                                cardRef.current.style.transform = 'translateX(0px) translateY(0px) rotate(0deg) scale(1)'
                                cardRef.current.style.opacity = ''
                                cardRef.current.style.boxShadow = ''
                            }
                        }}
                        onPointerMove={(e) => {
                            if (isAnimating) return
                            if (!cardRef.current) return

                            const deltaX = e.clientX - dragStartRef.current.x
                            const deltaY = e.clientY - dragStartRef.current.y
                            const distance = Math.hypot(deltaX, deltaY)

                            if (!dragActiveRef.current && distance > 5) {
                                dragActiveRef.current = true
                                setIsDragging(true)
                            }

                            if (!dragActiveRef.current) return

                            dragDeltaRef.current = { x: deltaX, y: deltaY }

                            // Tinder-like:
                            // - если жест горизонтальный → y почти ноль (без "плавания")
                            // - если жест вниз (details) → y становится заметным, x приглушаем
                            const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.2
                            const detailsProgress = Math.max(0, deltaY) / 180 // 0..~1
                            const clampedDetails = Math.max(0, Math.min(1, detailsProgress))

                            const limitedDy = horizontalIntent
                                ? Math.max(-18, Math.min(18, deltaY * 0.08))
                                : Math.max(0, Math.min(260, deltaY * 0.35))

                            const translateX = horizontalIntent ? deltaX : deltaX * 0.12
                            const rotation = horizontalIntent ? deltaX * 0.08 : deltaX * 0.04
                            const scale = 1.02

                            cardRef.current.style.transition = 'none'
                            cardRef.current.style.transform =
                                `translateX(${translateX}px) translateY(${limitedDy}px) rotate(${rotation}deg) scale(${scale})`

                            // Shadow only for horizontal intent (down-gesture shouldn't look like like/pass)
                            if (!horizontalIntent) {
                                cardRef.current.style.boxShadow = `0 10px 40px rgba(59, 130, 246, ${0.15 + clampedDetails * 0.35})`
                            } else if (deltaX > 40) {
                                cardRef.current.style.boxShadow = `0 0 50px rgba(34, 197, 94, ${Math.min(0.6, Math.abs(deltaX) / 300)})`
                            } else if (deltaX < -40) {
                                cardRef.current.style.boxShadow = `0 0 50px rgba(239, 68, 68, ${Math.min(0.6, Math.abs(deltaX) / 300)})`
                            } else {
                                cardRef.current.style.boxShadow = ''
                            }

                            if (detailsPullIndicatorRef.current) {
                                const show = !horizontalIntent && deltaY > 0
                                detailsPullIndicatorRef.current.style.opacity = show ? String(0.15 + clampedDetails * 0.85) : '0'
                                detailsPullIndicatorRef.current.style.transform = `translate(-50%, 0px) scale(${0.98 + clampedDetails * 0.04})`
                            }
                        }}
                        onPointerUp={(e) => {
                            setIsDragging(false)
                            if (!dragActiveRef.current) return
                            dragActiveRef.current = false

                            const { x: deltaX, y: deltaY } = dragDeltaRef.current
                            if (detailsPullIndicatorRef.current) {
                                detailsPullIndicatorRef.current.style.opacity = '0'
                            }

                            if (deltaX > 100) {
                                handleLike()
                            } else if (deltaX < -100) {
                                handlePass()
                            } else if (deltaY > 140 && Math.abs(deltaX) < 80) {
                                // Down for details
                                if (currentStartup.owner_nickname && currentStartup.slug) {
                                    navigate(`/${currentStartup.owner_nickname}/startup/${currentStartup.slug}`)
                                } else {
                                    navigate(`/startup/${currentStartup.id}`)
                                }
                            } else {
                                // Reset
                                resetCardStyles()
                            }
                        }}
                        onPointerCancel={() => {
                            setIsDragging(false)
                            dragActiveRef.current = false
                            resetCardStyles()
                        }}
                    >
                        <div className="startup-card h-full w-full rounded-[32px] overflow-hidden border border-glass-border bg-glass-bg shadow-2xl relative flex flex-col">
                        {/* Visible hint for "pull down for details" gesture */}
                        <div
                            ref={detailsPullIndicatorRef}
                            className="pointer-events-none absolute top-4 left-1/2 z-30 opacity-0"
                            style={{
                                transform: 'translate(-50%, 0px) scale(0.98)',
                                transition: 'opacity 120ms ease',
                            }}
                        >
                            <div className="bg-black/50 backdrop-blur-md text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/10">
                                Pull down for details
                            </div>
                        </div>
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

                                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5">
                                        <i className="fas fa-heart text-red-400 text-[10px]"></i>
                                        <span>{currentStartup.likes_count ?? 0}</span>
                                    </div>
                                    
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
                <OnboardingTutorial userId={user?.id} onComplete={() => setShowTutorial(false)} />
            )}
        </div>
    )
}

export default HomePageFixed
