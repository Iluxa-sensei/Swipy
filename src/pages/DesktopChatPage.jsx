import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useChats, useStartups } from '../hooks'
import { formatMessageTime } from '../utils/dateUtils'
import { searchService, chatService, startupService, supabase } from '../services'

const DesktopChatPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { chats, loading, error, refetch } = useChats(user?.id)
    const { startups } = useStartups()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [filter, setFilter] = useState('all')
    const [selectedStartupId, setSelectedStartupId] = useState(null)
    const [archivedChats, setArchivedChats] = useState([])
    const [userStartups, setUserStartups] = useState([])
    const searchContainerRef = useRef(null)

    useEffect(() => {
        const archived = JSON.parse(localStorage.getItem('archivedChats') || '[]')
        setArchivedChats(archived)
    }, [])

    // Load user's startups for founder filter
    useEffect(() => {
        const loadUserStartups = async () => {
            if (!user?.id) return
            try {
                const startups = await chatService.getUserStartupsForChats(user.id)
                setUserStartups(startups)
            } catch (err) {
                console.error('Error loading user startups:', err)
            }
        }
        loadUserStartups()
    }, [user?.id])

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
                let profiles = []
                let startups = []

                if (isUserSearch) {
                    console.log('Chat search: Searching for users with term:', searchTerm)
                    profiles = await searchService.searchProfiles(searchTerm, 5)
                    console.log('Chat search: User results:', profiles)
                } else {
                    // Search both startups and profiles when not using @ prefix
                    console.log('Chat search: Searching for startups and profiles with term:', searchTerm)
                    const [startupsResult, profilesResult] = await Promise.all([
                        searchService.searchStartups(searchTerm, 5),
                        searchService.searchProfiles(searchTerm, 5)
                    ])
                    startups = startupsResult
                    profiles = profilesResult
                    console.log('Chat search: Startup results:', startups)
                    console.log('Chat search: Profile results:', profiles)
                }

                setSearchResults({ startups, profiles })

                // Show results if we have any, otherwise hide dropdown
                if (startups.length > 0 || profiles.length > 0) {
                    setShowSearchResults(true)
                } else {
                    setShowSearchResults(false)
                }
            } catch (error) {
                console.error('Search error:', error)
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
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
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearchResultClick = async (type, item) => {
        if (!item || !item.id) {
            console.error('Invalid selection:', item)
            alert('Invalid selection')
            return
        }

        // Clear search immediately
        setSearchQuery('')
        setShowSearchResults(false)

        // Navigate to profile or startup page
        if (type === 'startup') {
            // Try to get startup details to find owner username and slug
            try {
                const { data: startup } = await supabase
                    .from('startups')
                    .select('slug, profiles!startups_owner_id_fkey(username)')
                    .eq('id', item.id)
                    .single()
                
                if (startup?.slug && startup?.profiles?.username) {
                    navigate(`/${startup.profiles.username}/startup/${startup.slug}`)
                } else if (item.id) {
                    navigate(`/startup/${item.id}`)
                } else {
                    console.error('Startup ID is missing')
                    alert('Unable to open startup')
                }
            } catch (error) {
                console.error('Error fetching startup details:', error)
                // Fallback to ID-based navigation
                if (item.id) {
                    navigate(`/startup/${item.id}`)
                } else {
                    alert('Unable to open startup')
                }
            }
        } else if (type === 'profile') {
            // Check if it's current user's profile
            if (item.id === user?.id) {
                navigate('/profile')
            } else if (item.username) {
                // Navigate to public profile page using username
                navigate(`/profile/${item.username}`)
            } else if (item.id) {
                // Fallback to ID
                navigate(`/profile/${item.id}`)
            } else {
                console.error('Profile ID and username are missing:', item)
                alert('Unable to open profile')
            }
        }
    }

    // Fetch other participant profiles for user chats
    const [participantProfiles, setParticipantProfiles] = useState({})

    useEffect(() => {
        const loadParticipantProfiles = async () => {
            if (!chats.length) return

            const userChats = chats.filter(c => c.chat_type === 'user' && c.other_participant_id)
            if (userChats.length === 0) return

            try {
                const { profileService } = await import('../services')
                const profiles = {}

                await Promise.all(
                    userChats.map(async (chat) => {
                        if (chat.other_participant_id && !profiles[chat.other_participant_id]) {
                            try {
                                const profile = await profileService.getProfile(chat.other_participant_id)
                                profiles[chat.other_participant_id] = profile
                            } catch (err) {
                                console.error('Error loading profile:', err)
                            }
                        }
                    })
                )

                setParticipantProfiles(profiles)
            } catch (err) {
                console.error('Error loading participant profiles:', err)
            }
        }

        loadParticipantProfiles()
    }, [chats])

    // Helper function to check if string is a URL or base64 image
    const isImageUrl = (str) => {
        if (!str || typeof str !== 'string') return false
        // Check for URL patterns
        if (str.startsWith('http://') || str.startsWith('https://')) return true
        // Check for base64 image data
        if (str.startsWith('data:image/')) return true
        // Very long strings are likely base64 or URLs (but not normal text)
        if (str.length > 50 && /^[A-Za-z0-9+/=]+$/.test(str)) return true
        return false
    }

    // Helper to safely truncate long strings (prevent URL/base64 display)
    const safeString = (str, maxLength = 100) => {
        if (!str) return ''
        // Convert to string if it's not
        const stringValue = String(str)

        // If it looks like a URL or base64, don't show it
        if (isImageUrl(stringValue)) return ''

        // If it's a very long string (likely base64 or URL), truncate heavily
        if (stringValue.length > maxLength) {
            // Check if it's mostly alphanumeric (likely base64)
            if (/^[A-Za-z0-9+/=]+$/.test(stringValue) && stringValue.length > 100) {
                return ''
            }
            return stringValue.substring(0, maxLength) + '...'
        }

        return stringValue
    }

    const chatList = chats.map((chat) => {
        if (chat.chat_type === 'user' && chat.other_participant_id) {
            // Use data from getUserChats (which now includes participant info)
            const profile = participantProfiles[chat.other_participant_id]
            const name = chat.other_participant_name || profile?.full_name || profile?.username || 'Unknown User'
            const avatarUrl = chat.other_participant_avatar || profile?.avatar_url
            // Only use avatar URL if it's actually a URL, otherwise use fallback letter
            const avatar = isImageUrl(avatarUrl) ? avatarUrl : (name?.charAt(0)?.toUpperCase() || 'U')

            return {
                id: chat.chat_id,
                name: name,
                lastMessage: chat.last_message_body || 'No messages yet',
                time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : 'Just now',
                unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
                unreadCount: chat.unread_count || 0,
                avatar: avatar,
                gradient: 'bg-gradient-to-br from-purple-300 to-purple-700',
                startupId: null,
                startup_slug: null,
                chatType: 'user',
                otherParticipantId: chat.other_participant_id,
                otherParticipant: profile
            }
        } else {
            const avatarUrl = chat.startup_logo
            // Only use logo URL if it's actually a URL, otherwise use fallback letter
            const avatar = isImageUrl(avatarUrl) ? avatarUrl : (chat.startup_name?.charAt(0)?.toUpperCase() || 'S')

            const mappedChat = {
                id: chat.chat_id,
                name: chat.startup_name || 'Unknown Startup',
                lastMessage: chat.last_message_body || 'No messages yet',
                time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : 'Just now',
                unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
                unreadCount: chat.unread_count || 0,
                avatar: avatar,
                gradient: chat.startup_gradient || 'bg-gradient-to-br from-blue-300 to-blue-700',
                startupId: chat.startup_id,
                startup_slug: chat.startup_slug,
                startup_owner_username: chat.startup_owner_username, // Add owner username for navigation
                chatType: 'startup',
                otherParticipant: chat.other_participant
            }
            return mappedChat
        }
    })

    const filteredChats = (() => {
        let filtered = chatList

        // Filter by startup if selected
        if (selectedStartupId) {
            filtered = filtered.filter(chat => chat.startupId === selectedStartupId)
        }

        // Filter by archived
        if (filter === 'archived') {
            return archivedChats.filter(chat =>
                chat.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by search query (only if not using search dropdown)
        if (searchQuery && !showSearchResults) {
            filtered = filtered.filter(chat => {
                return chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            })
        }

        // Filter by unread
        if (filter === 'unread') {
            filtered = filtered.filter(chat => chat.unread || chat.unreadCount > 0)
        }

        return filtered
    })()

    const openChat = async (chat) => {
        // For startup chats, always use the startup slug URL format
        if (chat.chatType === 'startup') {
            let startupSlug = chat.startup_slug
            // Use startup_owner_username first, then fallback to other sources
            let ownerUsername = chat.startup_owner_username || chat.otherParticipant?.username
            
            // If slug or owner username is missing but we have startupId, fetch it
            if ((!startupSlug || !ownerUsername) && chat.startupId) {
                try {
                    console.log('Fetching startup data for navigation, startupId:', chat.startupId)
                    const { data: startup, error } = await supabase
                        .from('startups')
                        .select('slug, owner_id, profiles!startups_owner_id_fkey(username)')
                        .eq('id', chat.startupId)
                        .single()
                    
                    if (!error && startup) {
                        startupSlug = startupSlug || startup.slug
                        // Get owner username from startup if not available
                        if (!ownerUsername && startup.profiles?.username) {
                            ownerUsername = startup.profiles.username
                        } else if (!ownerUsername && startup.owner_id) {
                            // Fetch owner profile
                            const { data: owner } = await supabase
                                .from('profiles')
                                .select('username')
                                .eq('id', startup.owner_id)
                                .single()
                            if (owner) ownerUsername = owner.username
                        }
                    } else if (error) {
                        console.error('Error fetching startup for navigation:', error)
                    }
                } catch (err) {
                    console.error('Error fetching startup slug for navigation:', err)
                }
            }
            
            // Navigate to startup chat if we have both slug and owner username
            if (startupSlug && ownerUsername) {
                navigate(`/chat-detail/${ownerUsername}/${startupSlug}`)
                return
            } else {
                console.warn('Missing startup slug or owner username, falling back to chat ID navigation', { startupSlug, ownerUsername, chatId: chat.id })
            }
        }
        
        // For user chats or if startup info is missing, use chatId
        if (chat.chat_id || chat.id) {
            navigate(`/chat-detail/${chat.chat_id || chat.id}`)
        } else if (chat.otherParticipant?.username) {
            // Fallback to nickname-based navigation for user chats
            navigate(`/chat-detail/${chat.otherParticipant.username}`)
        }
    }

    if (loading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-comments text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading conversations...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Chats</h2>
                            <p className="text-text-secondary mb-6">{error}</p>
                            <button
                                className="btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            {/* Search and Filters */}
            <div className="desktop-page-section">
                <div className="relative mb-6" ref={searchContainerRef}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <i className="fas fa-search text-text-secondary"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Search conversations, startups or @users..."
                        value={searchQuery}
                        onChange={(e) => {
                            const value = e.target.value
                            setSearchQuery(value)
                            if (value.trim().length >= 2) {
                                // Will show results when they arrive
                            } else {
                                setShowSearchResults(false)
                            }
                        }}
                        onFocus={() => {
                            if (searchQuery.trim().length >= 2) {
                                setShowSearchResults(true)
                            }
                        }}
                        className="w-full pl-12 pr-4 py-4 bg-bg-secondary/80 border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <i className="fa-solid fa-spinner fa-spin text-text-secondary"></i>
                        </div>
                    )}
                    {(showSearchResults || isSearching) && searchQuery.trim().length >= 2 && (
                        <div className="desktop-search-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 1000 }}>
                            {isSearching && (
                                <div className="search-results-section">
                                    <div className="text-text-secondary text-sm px-4 py-3 text-center flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        <span>Searching...</span>
                                    </div>
                                </div>
                            )}
                            {!isSearching && searchResults.startups.length === 0 && searchResults.profiles.length === 0 && (
                                <div className="search-results-section">
                                    <div className="text-text-secondary text-sm px-4 py-3 text-center">
                                        No results found for "{searchQuery}"
                                    </div>
                                </div>
                            )}
                            {!isSearching && searchResults.startups.length > 0 && (
                                <div className="search-results-section">
                                    <div className="search-results-header">
                                        <i className="fa-solid fa-rocket"></i>
                                        <span>Startups</span>
                                    </div>
                                    {searchResults.startups.map(startup => (
                                        <div
                                            key={startup.id}
                                            className="search-result-item"
                                            onClick={() => handleSearchResultClick('startup', startup)}
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
                                            onClick={() => handleSearchResultClick('profile', profile)}
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
                        </div>
                    )}
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                    {[
                        { key: 'all', label: 'All', icon: 'fas fa-comments' },
                        { key: 'unread', label: 'Unread', icon: 'fas fa-circle', count: chatList.filter(c => c.unread || c.unreadCount > 0).length },
                        { key: 'archived', label: 'Archived', icon: 'fas fa-archive', count: archivedChats.length }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setFilter(tab.key)
                                if (tab.key !== 'archived') setSelectedStartupId(null)
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${filter === tab.key
                                ? 'bg-gradient-to-r from-blue-300 to-blue-700 text-white shadow-lg'
                                : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-secondary border border-glass-border'
                                }`}
                        >
                            <i className={tab.icon}></i>
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-accent-primary text-white'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                    {userStartups.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                            <select
                                value={selectedStartupId || ''}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setSelectedStartupId(value || null)
                                    if (value) setFilter('all')
                                }}
                                className="px-4 py-3 rounded-xl bg-bg-secondary/80 border border-glass-border text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300 cursor-pointer"
                            >
                                <option value="">All Startups</option>
                                {userStartups.map(startup => (
                                    <option key={startup.id} value={startup.id}>
                                        {startup.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Chats List */}
            {filteredChats.length === 0 ? (
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-comments text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">
                                {searchQuery ? 'No matches found' : 'No Messages'}
                            </h2>
                            <p className="text-text-secondary mb-6">
                                {searchQuery
                                    ? 'Try adjusting your search terms'
                                    : 'Start matching with startups to begin conversations!'
                                }
                            </p>
                            {!searchQuery && (
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/home')}
                                >
                                    <i className="fas fa-search"></i>
                                    Discover Startups
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="desktop-grid desktop-grid-2">
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            className="desktop-card cursor-pointer group"
                            onClick={() => openChat(chat)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 ${chat.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden relative`}>
                                    {isImageUrl(chat.avatar) ? (
                                        <img
                                            src={chat.avatar}
                                            alt={chat.name}
                                            className="w-full h-full object-cover rounded-2xl absolute inset-0"
                                            onError={(e) => {
                                                // If image fails to load, hide it and show fallback
                                                e.target.style.display = 'none'
                                            }}
                                        />
                                    ) : null}
                                    <span className={isImageUrl(chat.avatar) ? 'opacity-0' : 'opacity-100'}>
                                        {chat.avatar && !isImageUrl(chat.avatar) ? chat.avatar : (chat.name?.[0]?.toUpperCase() || '?')}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-text-primary truncate" style={{
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {safeString(chat.name, 30)}
                                        </h3>
                                        <span className="text-sm text-text-secondary flex-shrink-0 ml-2">{chat.time}</span>
                                    </div>
                                    <p className={`text-sm truncate ${chat.unread ? 'text-text-primary font-medium' : 'text-text-secondary'}`} style={{
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%'
                                    }}>
                                        {safeString(chat.lastMessage, 50) || 'No messages yet'}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <div className="mt-2 flex justify-end">
                                            <span className="bg-accent-primary text-white text-xs px-2 py-1 rounded-full">
                                                {chat.unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DesktopChatPage

