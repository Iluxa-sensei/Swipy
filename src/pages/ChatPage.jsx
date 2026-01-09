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
    const [filter, setFilter] = useState('all') // all, unread, personal, startups, favorites, archived
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
        const otherParticipant = chat.other_participant
        const isStartupChat = !!chat.startup_id
        
        // Priority for name: Startup Name > Full Name > Username > "User"
        const displayName = isStartupChat 
            ? (chat.startup_name || 'Startup') 
            : (otherParticipant?.full_name || (otherParticipant?.username ? `@${otherParticipant.username}` : 'User'))
            
        const displayAvatar = isStartupChat ? chat.startup_logo : otherParticipant?.avatar_url
        
        return {
            id: chat.chat_id,
            name: displayName,
            lastMessage: chat.last_message_body || 'No messages yet',
            time: chat.last_message_at ? formatMessageTime(chat.last_message_at) : '',
            unread: chat.last_message_sender_id !== user?.id && chat.unread_count > 0,
            unreadCount: chat.unread_count || 0,
            avatar: displayAvatar,
            initials: (displayName || 'U').charAt(0).toUpperCase(),
            gradient: chat.startup_gradient || 'bg-gradient-to-br from-blue-300 to-blue-700',
            isOnline: false,
            lastSeen: null,
            isTyping: false,
            isFavorite: false,
            isPinned: false,
            startupId: chat.startup_id,
            isStartupChat: isStartupChat,
            otherParticipant: otherParticipant
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
                case 'personal':
                    return !chat.isStartupChat
                case 'startups':
                    return chat.isStartupChat
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
                        className="w-full pl-12 pr-4 py-4 bg-bg-secondary/80 border border-glass-border rounded-3xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
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
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { key: 'all', label: 'All', icon: 'fas fa-comments' },
                        { key: 'unread', label: 'Unread', icon: 'fas fa-circle', count: chatList.filter(c => c.unread || c.unreadCount > 0).length },
                        { key: 'personal', label: 'Personal', icon: 'fas fa-user' },
                        { key: 'startups', label: 'Startups', icon: 'fas fa-rocket' },
                        { key: 'favorites', label: 'Favorites', icon: 'fas fa-star' },
                        { key: 'archived', label: 'Archived', icon: 'fas fa-archive', count: archivedChats.length }
                    ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap ${filter === tab.key
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-bg-secondary text-text-secondary border border-glass-border'
                                    }`}
                            >
                            <i className={`${tab.icon} text-xs`}></i>
                            <span className="text-sm">{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-white/20' : 'bg-accent-primary text-white'
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
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-comments text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading conversations...</div>
                        </div>
                    </div>
                ) : sortedChats.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-64">
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
                ) : (
                    <div className="bg-bg-primary">
                        {sortedChats.map((chat, index) => (
                            <div
                                key={chat.id}
                                className="relative flex items-center gap-3 p-4 bg-bg-primary border-b border-glass-border/30 active:bg-bg-secondary"
                                onClick={() => filter === 'archived' ? null : openChat(chat.id)}
                            >
                                {/* Pinned indicator */}
                                {chat.isPinned && (
                                    <div className="absolute top-1.5 left-1.5">
                                        <i className="fas fa-thumbtack text-accent-primary text-[8px]"></i>
                                    </div>
                                )}

                                {/* Avatar with status */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-14 h-14 ${chat.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden`}>
                                        {chat.avatar ? (
                                            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{chat.initials}</span>
                                        )}
                                    </div>

                                    {/* Online status indicator */}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-bg-primary rounded-full ${chat.isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                </div>

                                {/* Chat content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="text-text-primary font-bold truncate text-base">{chat.name}</h4>
                                        <span className="text-text-secondary text-[10px] ml-2 flex-shrink-0">{chat.time}</span>
                                    </div>

                                    {/* Message preview */}
                                    <div className="flex items-center justify-between gap-2">
                                        {chat.isTyping ? (
                                            <span className="text-accent-primary text-xs font-medium italic">typing...</span>
                                        ) : (
                                            <p className={`text-sm truncate flex-1 ${chat.unread || chat.unreadCount > 0
                                                ? 'text-text-primary font-semibold'
                                                : 'text-text-secondary'
                                                }`}>
                                                {chat.lastMessage}
                                            </p>
                                        )}
                                        
                                        {(chat.unread || chat.unreadCount > 0) && (
                                            <span className="bg-accent-primary text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Startup Selector Modal */}
            {showStartupSelector && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowStartupSelector(false)}>
                    <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-glass-border rounded-full mx-auto mb-4"></div>

                        <h3 className="text-lg font-bold text-text-primary mb-4">Filter by Startup</h3>

                        <div className="space-y-3">
                            <button
                                className={`w-full flex items-center gap-4 p-4 rounded-xl ${!selectedStartup
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
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl ${selectedStartup === startupGroup.startupId
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
                    <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4">
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
                                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-bg-secondary/50 text-text-primary"
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
