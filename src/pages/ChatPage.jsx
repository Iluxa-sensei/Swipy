import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useChats, useStartups } from '../hooks'
import { formatMessageTime } from '../utils/dateUtils'

const ChatPageImproved = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { chats, loading, error } = useChats(user?.id)
    const { startups } = useStartups()
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('all') // all, unread, favorites, archived
    const [showMainMenu, setShowMainMenu] = useState(false)
    const [archivedChats, setArchivedChats] = useState([])
    const [selectedStartup, setSelectedStartup] = useState(null)
    const [showStartupSelector, setShowStartupSelector] = useState(false)

    // Load archived chats from localStorage
    useEffect(() => {
        const archived = JSON.parse(localStorage.getItem('archivedChats') || '[]')
        setArchivedChats(archived)
    }, [])

    // Transform chat data into display format
    const chatList = chats.map((chat) => {
        return {
            id: chat.chat_id,
            name: chat.startup_name || 'Unknown Startup',
            lastMessage: chat.last_message_body || 'No messages yet',
            time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : 'Just now',
            unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
            unreadCount: chat.unread_count || 0,
            avatar: chat.startup_logo || chat.startup_name?.charAt(0)?.toUpperCase() || 'S',
            gradient: chat.startup_gradient || 'bg-gradient-to-br from-blue-300 to-blue-700',
            isOnline: false,
            lastSeen: null,
            isTyping: false,
            isFavorite: false,
            isPinned: false,
            startupId: chat.startup_id,
            otherParticipant: chat.other_participant
        }
    })

    // Group chats by startup for better organization
    const chatsByStartup = chatList.reduce((acc, chat) => {
        const startupId = chat.startupId
        if (!acc[startupId]) {
            acc[startupId] = {
                startupId,
                startupName: chat.name,
                startupLogo: chat.avatar,
                startupGradient: chat.gradient,
                chats: []
            }
        }
        acc[startupId].chats.push(chat)
        return acc
    }, {})

    // Mark all as read
    const markAllAsRead = () => {
        console.log('Marking all chats as read')
        setShowMainMenu(false)
    }

    // Show archive
    const showArchived = () => {
        setFilter('archived')
        setShowMainMenu(false)
    }

    // Function to toggle favorite
    const toggleFavorite = (chatId, e) => {
        e.stopPropagation()
        console.log('Toggling favorite for chat:', chatId)
    }

    // Function to archive chat
    const archiveChat = (chatId, e) => {
        e.stopPropagation()
        const chatToArchive = chatList.find(chat => chat.id === chatId)
        if (chatToArchive) {
            const archivedChat = {
                ...chatToArchive,
                archivedAt: new Date().toISOString()
            }
            const newArchived = [...archivedChats, archivedChat]
            setArchivedChats(newArchived)
            localStorage.setItem('archivedChats', JSON.stringify(newArchived))
            console.log('Archiving chat:', chatId)
        }
    }

    // Show error state
    if (error) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/home')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Chats</h1>
                    <button className="header-btn" onClick={() => setShowMainMenu(!showMainMenu)}>
                        <i className="fas fa-ellipsis-v"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Chats</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
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

    // Chat filtering
    const filteredChats = (() => {
        if (filter === 'archived') {
            return archivedChats.filter(chat =>
                chat.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(chat => ({
                ...chat,
                lastMessage: `Archived on ${new Date(chat.archivedAt).toLocaleDateString()}`,
                time: new Date(chat.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: false,
                unreadCount: 0,
                isOnline: false
            }))
        }

        return chatList.filter(chat => {
            const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesSearch) return false

            switch (filter) {
                case 'unread':
                    return chat.unread || chat.unreadCount > 0
                case 'favorites':
                    return chat.isFavorite
                default:
                    return true
            }
        })
    })()

    // Sorting: pinned at top, then by time
    const sortedChats = [...filteredChats].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return 0
    })

    const openChat = (chatId) => {
        navigate(`/chat-detail/${chatId}`)
    }

    const openStartupDetail = (startupId) => {
        navigate(`/startup/${startupId}`)
    }

    // Show empty state if no chats
    if (chatList.length === 0 && !loading) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => setShowMainMenu(true)}>
                        <i className="fas fa-ellipsis-v"></i>
                    </button>
                    <h1>Messages</h1>
                    <div className="w-10"></div>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-comments text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">No Messages Yet</h2>
                        <p className="text-text-secondary mb-8">Start connecting with startups to see your conversations here.</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => navigate('/home')}
                        >
                            Browse Startups
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => setShowMainMenu(true)}>
                    <i className="fas fa-ellipsis-v"></i>
                </button>
                <h1>Messages</h1>
                <button
                    className="header-btn"
                    onClick={() => setShowStartupSelector(true)}
                    title="Filter by startup"
                >
                    <i className="fas fa-filter"></i>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-glass-border bg-bg-secondary/80">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-text-secondary"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-bg-secondary/80 border border-glass-border rounded-3xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-accent-primary/10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[
                        { key: 'all', label: 'All', icon: 'fas fa-comments' },
                        { key: 'unread', label: 'Unread', icon: 'fas fa-circle', count: chatList.filter(c => c.unread || c.unreadCount > 0).length },
                        { key: 'favorites', label: 'Favorites', icon: 'fas fa-star' },
                        { key: 'archived', label: 'Archived', icon: 'fas fa-archive', count: archivedChats.length }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${filter === tab.key
                                ? 'bg-gradient-primary text-white shadow-xl shadow-accent-primary/30'
                                : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-secondary hover:text-text-primary border border-glass-border'
                                }`}
                        >
                            <i className={tab.icon}></i>
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-accent-primary text-white animate-pulse'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-comments text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading conversations...</div>
                        </div>
                    </div>
                ) : sortedChats.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
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
                                    className="btn-primary hover:scale-105 transition-transform duration-200"
                                    onClick={() => navigate('/home')}
                                >
                                    <i className="fas fa-search"></i>
                                    Discover Startups
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-glass-border">
                        {sortedChats.map((chat, index) => (
                            <div
                                key={chat.id}
                                className="group relative flex items-center gap-4 p-6 bg-bg-secondary/50 hover:bg-bg-secondary/80 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-l-4 border-transparent hover:border-accent-primary rounded-r-2xl"
                                onClick={() => filter === 'archived' ? null : openChat(chat.id)}
                            >
                                {/* Pinned indicator */}
                                {chat.isPinned && (
                                    <div className="absolute top-2 left-2">
                                        <i className="fas fa-thumbtack text-accent-primary text-xs"></i>
                                    </div>
                                )}

                                {/* Avatar with status */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-16 h-16 ${chat.gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                                        {chat.avatar}
                                    </div>

                                    {/* Online/Offline status */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-3 border-bg-primary rounded-full transition-all duration-300 ${chat.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                                        }`}></div>

                                    {/* Favorite indicator */}
                                    {chat.isFavorite && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                            <i className="fas fa-star text-xs text-white"></i>
                                        </div>
                                    )}
                                </div>

                                {/* Chat content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-text-primary font-semibold truncate text-xl">{chat.name}</h4>
                                            {chat.isOnline && (
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <div className="text-text-secondary text-base mb-1">{chat.time}</div>
                                            {(chat.unread || chat.unreadCount > 0) && (
                                                <div className="flex justify-end">
                                                    <span className="bg-accent-primary text-white text-xs px-2 py-1 rounded-full min-w-[20px] inline-block text-center">
                                                        {chat.unreadCount}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message preview */}
                                    <div className="flex items-center gap-2">
                                        {chat.isTyping ? (
                                            <div className="flex items-center gap-2 text-accent-primary">
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce"></div>
                                                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                                <span className="text-sm font-medium">typing...</span>
                                            </div>
                                        ) : (
                                            <p className={`text-base truncate ${chat.unread || chat.unreadCount > 0
                                                ? 'text-text-primary font-medium'
                                                : 'text-text-secondary'
                                                }`}>
                                                {chat.lastMessage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Startup context */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-text-secondary">About:</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                openStartupDetail(chat.startupId)
                                            }}
                                            className="text-xs text-accent-primary hover:text-accent-primary/80 font-medium hover:underline"
                                        >
                                            {chat.name}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick actions */}
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        className={`w-8 h-8 bg-bg-secondary/80 border border-glass-border rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${chat.isFavorite
                                            ? 'text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400'
                                            : 'text-text-secondary hover:bg-accent-primary hover:text-white hover:border-accent-primary'
                                            }`}
                                        onClick={(e) => toggleFavorite(chat.id, e)}
                                        title={chat.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <i className="fas fa-star"></i>
                                    </button>
                                    <button
                                        className="w-8 h-8 bg-bg-secondary/80 border border-glass-border rounded-full flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 hover:scale-110"
                                        onClick={(e) => archiveChat(chat.id, e)}
                                        title="Archive conversation"
                                    >
                                        <i className="fas fa-archive"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Startup Selector Modal */}
            {showStartupSelector && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowStartupSelector(false)}>
                    <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4 animate-slide-up max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-glass-border rounded-full mx-auto mb-4"></div>

                        <h3 className="text-lg font-bold text-text-primary mb-4">Filter by Startup</h3>

                        <div className="space-y-3">
                            <button
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${!selectedStartup
                                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary'
                                    : 'hover:bg-glass-bg text-text-primary'
                                    }`}
                                onClick={() => {
                                    setSelectedStartup(null)
                                    setShowStartupSelector(false)
                                }}
                            >
                                <i className="fas fa-globe"></i>
                                <span className="font-medium">All Startups</span>
                            </button>

                            {Object.values(chatsByStartup).map((startupGroup) => (
                                <button
                                    key={startupGroup.startupId}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${selectedStartup === startupGroup.startupId
                                        ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary'
                                        : 'hover:bg-glass-bg text-text-primary'
                                        }`}
                                    onClick={() => {
                                        setSelectedStartup(startupGroup.startupId)
                                        setShowStartupSelector(false)
                                    }}
                                >
                                    <div className={`w-12 h-12 ${startupGroup.startupGradient} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                                        {startupGroup.startupLogo}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{startupGroup.startupName}</div>
                                        <div className="text-sm text-text-secondary">{startupGroup.chats.length} conversation{startupGroup.chats.length !== 1 ? 's' : ''}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Menu Modal */}
            {showMainMenu && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowMainMenu(false)}>
                    <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4 animate-slide-up">
                        <div className="w-12 h-1 bg-glass-border rounded-full mx-auto mb-4"></div>

                        <h3 className="text-lg font-bold text-text-primary mb-4">Chat Options</h3>

                        {[
                            {
                                icon: 'fas fa-check-double',
                                label: 'Mark all as read',
                                action: markAllAsRead,
                                count: chatList.filter(c => c.unread || c.unreadCount > 0).length
                            },
                            {
                                icon: 'fas fa-archive',
                                label: 'Archived chats',
                                action: showArchived,
                                count: archivedChats.length
                            },
                            {
                                icon: 'fas fa-home',
                                label: 'Back to home',
                                action: () => navigate('/home')
                            },
                        ].map((action) => (
                            <button
                                key={action.label}
                                className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:bg-bg-secondary/50 text-text-primary"
                                onClick={() => {
                                    action.action();
                                    setShowMainMenu(false);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <i className={action.icon}></i>
                                    <span className="font-medium">{action.label}</span>
                                </div>
                                {action.count > 0 && (
                                    <span className="bg-accent-primary text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                                        {action.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatPageImproved
