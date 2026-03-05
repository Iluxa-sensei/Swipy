import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, useChats } from '../hooks'
import { formatMessageTime, formatDate } from '../utils/dateUtils'
import { searchService, chatService, profileService, supabase } from '../services'
import Loader from '../components/Loader.jsx'

const DesktopChatPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const { chats, loading, error } = useChats(user?.id)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({ startups: [], profiles: [] })
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [userStartups, setUserStartups] = useState([])
    const searchContainerRef = useRef(null)

    // Sidebar: expanded startup groups
    const [expandedStartups, setExpandedStartups] = useState(new Set())

    // Chat detail state
    const [activeChatId, setActiveChatId] = useState(null)
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [participants, setParticipants] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatError, setChatError] = useState(null)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)

    const [participantProfiles, setParticipantProfiles] = useState({})

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

    // Search
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

            if (searchTerm.length < 2) {
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
                setIsSearching(false)
                return
            }
            try {
                let profiles = [], startups = []
                if (isUserSearch) {
                    profiles = await searchService.searchProfiles(searchTerm, 5)
                } else {
                    const [s, p] = await Promise.all([
                        searchService.searchStartups(searchTerm, 5),
                        searchService.searchProfiles(searchTerm, 5)
                    ])
                    startups = s; profiles = p
                }
                setSearchResults({ startups, profiles })
                setShowSearchResults(startups.length > 0 || profiles.length > 0)
            } catch (err) {
                setSearchResults({ startups: [], profiles: [] })
                setShowSearchResults(false)
            } finally {
                setIsSearching(false)
            }
        }
        const t = setTimeout(performSearch, 300)
        return () => clearTimeout(t)
    }, [searchQuery])

    useEffect(() => {
        const handler = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSearchResults(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSearchResultClick = async (type, item) => {
        if (!item || !item.id) return
        setSearchQuery('')
        setShowSearchResults(false)
        if (type === 'startup') {
            try {
                const { data: startup } = await supabase.from('startups').select('slug, profiles!startups_owner_id_fkey(username)').eq('id', item.id).single()
                if (startup?.slug && startup?.profiles?.username) navigate(`/${startup.profiles.username}/startup/${startup.slug}`)
                else if (item.id) navigate(`/startup/${item.id}`)
            } catch { if (item.id) navigate(`/startup/${item.id}`) }
        } else if (type === 'profile') {
            if (item.id === user?.id) navigate('/profile')
            else if (item.username) navigate(`/profile/${item.username}`)
            else if (item.id) navigate(`/profile/${item.id}`)
        }
    }

    // Load participant profiles
    useEffect(() => {
        const load = async () => {
            if (!chats.length) return
            const all = chats.filter(c => c.other_participant_id || (c.chat_type !== 'user' && c.other_participant))
            if (all.length === 0) return
            try {
                const profiles = {}
                const idsToLoad = new Set()
                chats.forEach(c => {
                    if (c.other_participant_id) idsToLoad.add(c.other_participant_id)
                    if (c.other_participant?.id) idsToLoad.add(c.other_participant.id)
                })
                await Promise.all([...idsToLoad].map(async (id) => {
                    if (profiles[id]) return
                    try {
                        const profile = await profileService.getProfile(id)
                        if (profile) profiles[id] = profile
                    } catch { /* skip */ }
                }))
                setParticipantProfiles(profiles)
            } catch (err) {
                console.error('Error loading participant profiles:', err)
            }
        }
        load()
    }, [chats])

    const isImageUrl = (str) => {
        if (!str || typeof str !== 'string') return false
        if (str.startsWith('http://') || str.startsWith('https://')) return true
        if (str.startsWith('data:image/')) return true
        if (str.length > 50 && /^[A-Za-z0-9+/=]+$/.test(str)) return true
        return false
    }

    const safeString = (str, maxLength = 100) => {
        if (!str) return ''
        const s = String(str)
        if (isImageUrl(s)) return ''
        if (s.length > maxLength) {
            if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length > 100) return ''
            return s.substring(0, maxLength) + '...'
        }
        return s
    }

    const isValidUUID = (str) => {
        if (!str) return false
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    }

    // Build chat items — for startup chats show the OTHER person's name, not startup name
    const chatList = useMemo(() => chats.map((chat) => {
        if (chat.chat_type === 'user' && chat.other_participant_id) {
            const profile = participantProfiles[chat.other_participant_id]
            const name = chat.other_participant_name || profile?.full_name || profile?.username || 'Unknown User'
            const avatarUrl = chat.other_participant_avatar || profile?.avatar_url
            const avatar = isImageUrl(avatarUrl) ? avatarUrl : (name?.charAt(0)?.toUpperCase() || 'U')
            return {
                id: chat.chat_id,
                name,
                lastMessage: chat.last_message_body || 'No messages yet',
                time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : '',
                unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
                unreadCount: chat.unread_count || 0,
                avatar, gradient: 'bg-gradient-to-br from-purple-400 to-purple-700',
                startupId: null, startupName: null, startupLogo: null, startupGradient: null,
                startup_slug: null, startup_owner_username: null,
                chatType: 'user',
                otherParticipantId: chat.other_participant_id,
                otherParticipant: profile
            }
        } else {
            // Startup chat: display the OTHER participant (the person writing to the startup)
            const other = chat.other_participant || participantProfiles[chat.other_participant?.id]
            const personName = other?.full_name || other?.username || 'Unknown User'
            const personAvatarUrl = other?.avatar_url
            const personAvatar = isImageUrl(personAvatarUrl) ? personAvatarUrl : (personName?.charAt(0)?.toUpperCase() || 'U')

            return {
                id: chat.chat_id,
                name: personName,
                lastMessage: chat.last_message_body || 'No messages yet',
                time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : '',
                unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
                unreadCount: chat.unread_count || 0,
                avatar: personAvatar,
                gradient: 'bg-gradient-to-br from-purple-400 to-purple-700',
                startupId: chat.startup_id,
                startupName: chat.startup_name || 'Unknown Startup',
                startupLogo: chat.startup_logo,
                startupGradient: chat.startup_gradient || 'bg-gradient-to-br from-blue-400 to-blue-700',
                startup_slug: chat.startup_slug,
                startup_owner_username: chat.startup_owner_username,
                chatType: 'startup',
                otherParticipant: other
            }
        }
    }), [chats, participantProfiles, user?.id])

    // Separate direct chats and startup-grouped chats
    const directChats = useMemo(() => {
        let items = chatList.filter(c => c.chatType === 'user')
        if (searchQuery && !showSearchResults) {
            items = items.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
        return items
    }, [chatList, searchQuery, showSearchResults])

    const startupGroups = useMemo(() => {
        const groups = {}
        chatList.filter(c => c.chatType === 'startup').forEach(chat => {
            const sid = chat.startupId || 'unknown'
            if (!groups[sid]) {
                groups[sid] = {
                    startupId: sid,
                    startupName: chat.startupName,
                    startupLogo: chat.startupLogo,
                    startupGradient: chat.startupGradient,
                    chats: [],
                    totalUnread: 0,
                }
            }
            if (searchQuery && !showSearchResults) {
                const q = searchQuery.toLowerCase()
                if (!chat.name.toLowerCase().includes(q) && !chat.lastMessage.toLowerCase().includes(q) && !groups[sid].startupName.toLowerCase().includes(q)) return
            }
            groups[sid].chats.push(chat)
            groups[sid].totalUnread += chat.unreadCount || 0
        })
        return Object.values(groups).filter(g => g.chats.length > 0)
    }, [chatList, searchQuery, showSearchResults])

    const toggleStartupGroup = (startupId) => {
        setExpandedStartups(prev => {
            const next = new Set(prev)
            if (next.has(startupId)) next.delete(startupId)
            else next.add(startupId)
            return next
        })
    }

    const unreadTotal = chatList.filter(c => c.unread || c.unreadCount > 0).length

    // --- Chat detail logic ---
    const loadChatDetail = useCallback(async (chatId) => {
        if (!chatId || !user?.id || !isValidUUID(chatId)) return
        try {
            setChatLoading(true)
            setChatError(null)
            let chatInfo = await chatService.getChatInfo(chatId)
            if (!chatInfo) {
                let retries = 0
                while (!chatInfo && retries < 3) {
                    await new Promise(r => setTimeout(r, 1000 * (retries + 1)))
                    chatInfo = await chatService.getChatInfo(chatId)
                    retries++
                }
                if (!chatInfo) { setChatError('Chat not found'); return }
            }
            if (!chatInfo.participants?.length) { setChatError('Chat has no participants'); return }

            const chatMessages = await chatService.getChatMessages(chatId)
            const parts = await Promise.all(
                (chatInfo.participants || []).map(async (pid) => {
                    if (pid === user.id) return { id: user.id, full_name: user.user_metadata?.full_name || 'You', avatar_url: user.user_metadata?.avatar_url }
                    const profile = await profileService.getProfile(pid)
                    return profile || { id: pid, full_name: 'Unknown User' }
                })
            )
            setActiveChat(chatInfo)
            setMessages(chatMessages)
            setParticipants(parts)
            try { await chatService.markChatAsRead(chatId, user.id) } catch { /* skip */ }
        } catch (err) {
            setChatError(err.message)
        } finally {
            setChatLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        if (!activeChatId) return
        const channel = chatService.subscribeToMessages(activeChatId, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev
                    const sp = participants.find(p => p.id === newMsg.sender_id)
                    return [...prev, { ...newMsg, profiles: sp || null }]
                })
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
        })
        return () => { if (channel?.unsubscribe) channel.unsubscribe() }
    }, [activeChatId, participants])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const openChat = (chat) => {
        setActiveChatId(chat.id)
        loadChatDetail(chat.id)
    }

    // URL-based chat opening
    useEffect(() => {
        const path = location.pathname
        const m = path.match(/\/chat-detail\/(.+)/)
        if (m) {
            const parts = m[1].split('/')
            if (parts.length === 2) {
                (async () => {
                    if (!user?.id) return
                    setChatLoading(true)
                    try {
                        const id = await chatService.getChatByPrettyParams(user.id, parts[0], parts[1])
                        if (id) { setActiveChatId(id); loadChatDetail(id) }
                    } catch { setChatError('Failed to load chat') }
                })()
            } else if (isValidUUID(parts[0])) {
                setActiveChatId(parts[0])
                loadChatDetail(parts[0])
            } else {
                (async () => {
                    if (!user?.id) return
                    setChatLoading(true)
                    try {
                        const id = await chatService.getChatByPrettyParams(user.id, parts[0])
                        if (id) { setActiveChatId(id); loadChatDetail(id) }
                    } catch { setChatError('Failed to load chat') }
                })()
            }
        }
    }, [location.pathname, user?.id, loadChatDetail])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !user?.id || !activeChatId) return
        try {
            setSending(true)
            const message = await chatService.sendMessage(activeChatId, user.id, newMessage.trim())
            const sp = participants.find(p => p.id === user.id) || { id: user.id, full_name: user.user_metadata?.full_name, avatar_url: user.user_metadata?.avatar_url }
            setMessages(prev => [...prev, { ...message, profiles: sp }])
            setNewMessage('')
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        } catch (err) {
            setChatError('Failed to send message')
            setTimeout(() => setChatError(null), 5000)
        } finally {
            setSending(false)
        }
    }

    const otherParticipant = participants.find(p => p.id !== user?.id)
    const chatName = activeChat?.startup?.name
        ? `${otherParticipant?.full_name || otherParticipant?.username || 'User'}`
        : (otherParticipant?.full_name || otherParticipant?.username || 'Chat')
    const chatSubtitle = activeChat?.startup?.name ? activeChat.startup.name : 'Direct message'
    const chatAvatar = otherParticipant?.avatar_url
    const chatGradient = 'bg-gradient-to-br from-purple-400 to-purple-700'

    const groupMessagesByDate = (msgs) => {
        const groups = []
        let currentDate = null, currentGroup = []
        msgs.forEach((msg) => {
            const d = formatDate(msg.created_at)
            if (d !== currentDate) {
                if (currentGroup.length > 0) groups.push({ date: currentDate, messages: currentGroup })
                currentDate = d; currentGroup = [msg]
            } else currentGroup.push(msg)
        })
        if (currentGroup.length > 0) groups.push({ date: currentDate, messages: currentGroup })
        return groups
    }
    const messageGroups = groupMessagesByDate(messages)

    // --- Render helpers ---
    const renderChatItem = (chat) => (
        <div
            key={chat.id}
            className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
            onClick={() => openChat(chat)}
        >
            <div className={`chat-list-avatar ${chat.gradient}`}>
                {isImageUrl(chat.avatar) ? (
                    <img src={chat.avatar} alt={chat.name} onError={(e) => { e.target.style.display = 'none' }} />
                ) : null}
                <span className={isImageUrl(chat.avatar) ? 'opacity-0' : ''}>
                    {chat.avatar && !isImageUrl(chat.avatar) ? chat.avatar : (chat.name?.[0]?.toUpperCase() || '?')}
                </span>
            </div>
            <div className="chat-list-info">
                <div className="chat-list-top">
                    <span className="chat-list-name">{safeString(chat.name, 24)}</span>
                    <span className="chat-list-time">{chat.time}</span>
                </div>
                <div className="chat-list-bottom">
                    <span className="chat-list-message">{safeString(chat.lastMessage, 36) || 'No messages yet'}</span>
                    {chat.unreadCount > 0 && <span className="chat-unread-badge">{chat.unreadCount}</span>}
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="chat-unified-layout">
                <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center"><Loader /><div className="text-text-secondary mt-4">Loading conversations...</div></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chat-unified-layout">
                <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-2xl text-white"></i>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary mb-3">Error Loading Chats</h2>
                        <p className="text-text-secondary mb-6 text-sm">{error}</p>
                        <button className="chat-btn-primary" onClick={() => window.location.reload()}>Retry</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-unified-layout">
            {/* LEFT SIDEBAR */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2 className="text-lg font-bold text-text-primary">Chats</h2>
                    {unreadTotal > 0 && <span className="chat-unread-badge-header">{unreadTotal}</span>}
                </div>

                {/* Search */}
                <div className="chat-sidebar-search" ref={searchContainerRef}>
                    <div className="chat-search-input-wrap">
                        <i className="fa-solid fa-magnifying-glass chat-search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search chats or @users..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                if (e.target.value.trim().length >= 2) setShowSearchResults(true)
                                else setShowSearchResults(false)
                            }}
                            onFocus={() => { if (searchQuery.trim().length >= 2) setShowSearchResults(true) }}
                            className="chat-search-input"
                        />
                        {isSearching && <i className="fa-solid fa-spinner fa-spin chat-search-spinner"></i>}
                    </div>
                    {(showSearchResults || isSearching) && searchQuery.trim().length >= 2 && (
                        <div className="chat-search-dropdown">
                            {isSearching && (
                                <div className="chat-search-dropdown-loading"><i className="fa-solid fa-spinner fa-spin"></i><span>Searching...</span></div>
                            )}
                            {!isSearching && searchResults.startups.length === 0 && searchResults.profiles.length === 0 && (
                                <div className="chat-search-dropdown-empty">No results for &ldquo;{searchQuery}&rdquo;</div>
                            )}
                            {!isSearching && searchResults.startups.length > 0 && (
                                <div className="chat-search-section">
                                    <div className="chat-search-section-title"><i className="fa-solid fa-rocket"></i> Startups</div>
                                    {searchResults.startups.map(s => (
                                        <div key={s.id} className="chat-search-result" onClick={() => handleSearchResultClick('startup', s)}>
                                            <div className="chat-search-result-avatar">
                                                {s.logo_url ? <img src={s.logo_url} alt={s.name} /> : (
                                                    <div className={`chat-search-result-fallback ${s.gradient || 'bg-gradient-to-br from-blue-400 to-blue-700'}`}>{s.logo || s.name?.[0] || 'S'}</div>
                                                )}
                                            </div>
                                            <span className="chat-search-result-name">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!isSearching && searchResults.profiles.length > 0 && (
                                <div className="chat-search-section">
                                    <div className="chat-search-section-title"><i className="fa-solid fa-user"></i> People</div>
                                    {searchResults.profiles.map(p => (
                                        <div key={p.id} className="chat-search-result" onClick={() => handleSearchResultClick('profile', p)}>
                                            <div className="chat-search-result-avatar">
                                                {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name || p.username} /> : (
                                                    <div className="chat-search-result-fallback bg-gradient-to-br from-purple-400 to-purple-700">{(p.full_name || p.username || 'U')?.[0]?.toUpperCase()}</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="chat-search-result-name">{p.full_name || p.username || 'User'}</span>
                                                {p.username && <span className="text-xs text-text-secondary">@{p.username}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat List — organized as sections */}
                <div className="chat-list">
                    {directChats.length === 0 && startupGroups.length === 0 ? (
                        <div className="chat-list-empty">
                            <i className="fa-regular fa-comments"></i>
                            <p>{searchQuery ? 'No matches found' : 'No conversations yet'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Direct Messages */}
                            {directChats.length > 0 && (
                                <div className="chat-section">
                                    <div className="chat-section-title">
                                        <i className="fa-solid fa-user"></i>
                                        <span>Direct Messages</span>
                                        <span className="chat-section-count">{directChats.length}</span>
                                    </div>
                                    {directChats.map(renderChatItem)}
                                </div>
                            )}

                            {/* My Startups */}
                            {startupGroups.length > 0 && (
                                <div className="chat-section">
                                    <div className="chat-section-title">
                                        <i className="fa-solid fa-rocket"></i>
                                        <span>My Startups</span>
                                    </div>
                                    {startupGroups.map(group => {
                                        const isOpen = expandedStartups.has(group.startupId)
                                        const logoUrl = group.startupLogo
                                        const logoIsImg = isImageUrl(logoUrl)

                                        return (
                                            <div key={group.startupId} className="chat-startup-group">
                                                <div
                                                    className={`chat-startup-group-header ${isOpen ? 'open' : ''}`}
                                                    onClick={() => toggleStartupGroup(group.startupId)}
                                                >
                                                    <div className={`chat-startup-group-icon ${group.startupGradient}`}>
                                                        {logoIsImg ? (
                                                            <img src={logoUrl} alt={group.startupName} />
                                                        ) : (
                                                            <span>{group.startupName?.[0]?.toUpperCase() || 'S'}</span>
                                                        )}
                                                    </div>
                                                    <span className="chat-startup-group-name">{group.startupName}</span>
                                                    <span className="chat-startup-group-count">{group.chats.length}</span>
                                                    {group.totalUnread > 0 && (
                                                        <span className="chat-unread-badge">{group.totalUnread}</span>
                                                    )}
                                                    <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} chat-startup-group-arrow`}></i>
                                                </div>
                                                {isOpen && (
                                                    <div className="chat-startup-group-chats">
                                                        {group.chats.map(renderChatItem)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT CHAT AREA */}
            <div className="chat-main">
                {!activeChatId ? (
                    <div className="chat-main-empty">
                        <div className="chat-main-empty-icon"><i className="fa-regular fa-comments"></i></div>
                        <h3>Select a conversation</h3>
                        <p>Choose a chat from the sidebar to start messaging</p>
                    </div>
                ) : chatLoading ? (
                    <div className="chat-main-loading"><Loader /><div className="text-text-secondary mt-4">Loading conversation...</div></div>
                ) : chatError ? (
                    <div className="chat-main-empty">
                        <div className="chat-main-empty-icon error"><i className="fa-solid fa-exclamation-triangle"></i></div>
                        <h3>Error Loading Chat</h3>
                        <p>{chatError}</p>
                        <button className="chat-btn-primary mt-4" onClick={() => loadChatDetail(activeChatId)}>
                            <i className="fa-solid fa-redo mr-2"></i> Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="chat-detail-header">
                            <div className="flex items-center gap-3">
                                <div className={`chat-detail-avatar ${chatGradient}`}>
                                    {chatAvatar ? <img src={chatAvatar} alt={chatName} /> : <span>{chatName?.[0]?.toUpperCase() || 'C'}</span>}
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-text-primary">{chatName}</h3>
                                    <p className="text-xs text-text-secondary">{chatSubtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {otherParticipant && (
                                    <button
                                        className="chat-header-btn"
                                        title="View profile"
                                        onClick={() => {
                                            if (otherParticipant.username) navigate(`/profile/${otherParticipant.username}`)
                                        }}
                                    >
                                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                    </button>
                                )}
                                {activeChat?.startup && (
                                    <button
                                        className="chat-header-btn"
                                        title={`View ${activeChat.startup.name}`}
                                        onClick={() => {
                                            const slug = activeChat.startup.slug
                                            const owner = activeChat.startup.profiles?.username
                                            if (slug && owner) navigate(`/${owner}/startup/${slug}`)
                                        }}
                                    >
                                        <i className="fa-solid fa-rocket"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="chat-messages-area">
                            {messageGroups.length === 0 ? (
                                <div className="chat-messages-empty">
                                    <div className="chat-messages-empty-icon"><i className="fa-regular fa-paper-plane"></i></div>
                                    <p className="text-text-secondary">No messages yet</p>
                                    <p className="text-text-secondary text-xs mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messageGroups.map((group, gi) => (
                                        <div key={gi}>
                                            <div className="chat-date-separator"><span>{group.date}</span></div>
                                            <div className="space-y-2">
                                                {group.messages.map((msg, i) => {
                                                    const isOwn = msg.sender_id === user?.id
                                                    const sp = participants.find(p => p.id === msg.sender_id)
                                                    const showAv = i === 0 || group.messages[i - 1]?.sender_id !== msg.sender_id
                                                    return (
                                                        <div key={msg.id} className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
                                                            {!isOwn && showAv ? (
                                                                <div className="chat-message-avatar">
                                                                    {sp?.avatar_url ? <img src={sp.avatar_url} alt={sp.full_name} /> : <span>{(sp?.full_name || 'U')?.[0]?.toUpperCase()}</span>}
                                                                </div>
                                                            ) : !isOwn ? <div className="chat-message-avatar-spacer"></div> : null}
                                                            <div className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
                                                                {showAv && !isOwn && <span className="chat-bubble-sender">{sp?.full_name || sp?.username || 'User'}</span>}
                                                                <p className="chat-bubble-text">{msg.body}</p>
                                                                <div className={`chat-bubble-meta ${isOwn ? 'own' : ''}`}>
                                                                    <span>{formatMessageTime(msg.created_at)}</span>
                                                                    {isOwn && <i className="fa-solid fa-check"></i>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef}></div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <form onSubmit={handleSendMessage} className="chat-input-form">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Write a message..."
                                    className="chat-input"
                                    disabled={sending}
                                />
                                <button type="submit" disabled={!newMessage.trim() || sending} className="chat-send-btn" title="Send">
                                    {sending ? <i className="fa-solid fa-spinner fa-spin"></i> : <>Send <i className="fa-solid fa-paper-plane"></i></>}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default DesktopChatPage
