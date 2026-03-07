import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { chatService, profileService } from '../services'
import { formatMessageTime, formatDate } from '../utils/dateUtils'
import Loader from '../components/Loader.jsx'

const DesktopChatDetailPage = () => {
    const { chatId: initialChatId, nickname, startup_name } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [chatId, setChatId] = useState(initialChatId)
    const [chat, setChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [participants, setParticipants] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)

    // Helper function to check if string is a valid UUID
    const isValidUUID = (str) => {
        if (!str) return false
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
    }

    // Initial ID resolution if nickname/startup_name is used
    useEffect(() => {
        const resolveChatId = async () => {
            // If initialChatId is not a valid UUID, treat it as nickname
            if (initialChatId && !isValidUUID(initialChatId)) {
                // This looks like a nickname or slug, handle it as nickname
                if (user?.id) {
                    setLoading(true)
                    try {
                        const resolvedId = await chatService.getChatByPrettyParams(user.id, initialChatId, startup_name)
                        if (resolvedId) {
                            setChatId(resolvedId)
                        } else {
                            setError('Could not find or create this chat.')
                            setLoading(false)
                        }
                    } catch (err) {
                        console.error('Error resolving chat ID:', err)
                        setError('Failed to load chat details.')
                        setLoading(false)
                    }
                }
                return
            }

            // If it's a valid UUID, use it directly
            if (initialChatId && isValidUUID(initialChatId)) {
                setChatId(initialChatId)
                return
            }

            // If we have nickname, use it
            if (nickname && user?.id) {
                setLoading(true)
                try {
                    const resolvedId = await chatService.getChatByPrettyParams(user.id, nickname, startup_name)
                    if (resolvedId) {
                        setChatId(resolvedId)
                    } else {
                        setError('Could not find or create this chat.')
                        setLoading(false)
                    }
                } catch (err) {
                    console.error('Error resolving chat ID:', err)
                    setError('Failed to load chat details.')
                    setLoading(false)
                }
            }
        }

        resolveChatId()
    }, [initialChatId, nickname, startup_name, user?.id])

    // Load chat data
    useEffect(() => {
        const loadChat = async () => {
            if (!chatId || !user?.id) return

            // Don't try to load if chatId is not a valid UUID (still resolving)
            if (!isValidUUID(chatId)) {
                console.log('ChatId is not a valid UUID yet, waiting for resolution:', chatId)
                return
            }

            try {
                setLoading(true)
                setError(null)

                console.log('Loading chat info for chatId:', chatId)
                let chatInfo = await chatService.getChatInfo(chatId)

                if (!chatInfo) {
                    console.warn('Chat info is null for chatId:', chatId, '- retrying...')
                    // Try multiple retries with increasing delays (chat might still be creating)
                    let retries = 0
                    const maxRetries = 5
                    while (!chatInfo && retries < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
                        chatInfo = await chatService.getChatInfo(chatId)
                        if (chatInfo) {
                            console.log('Chat found on retry', retries + 1, ':', chatInfo)
                            break
                        }
                        retries++
                    }

                    if (!chatInfo) {
                        console.error('Chat still not found after', maxRetries, 'retries for chatId:', chatId)
                        setError(`Chat not found. Chat ID: ${chatId}. Please try refreshing the page.`)
                        return
                    }
                }

                console.log('Chat info loaded:', chatInfo)

                if (!chatInfo.participants || chatInfo.participants.length === 0) {
                    console.error('Chat has no participants:', chatInfo)
                    setError('Chat has no participants')
                    return
                }

                const chatMessages = await chatService.getChatMessages(chatId)
                console.log('Chat messages loaded:', chatMessages.length)

                // Get participant profiles
                const participantProfiles = await Promise.all(
                    (chatInfo.participants || []).map(async (participantId) => {
                        if (participantId === user.id) {
                            return { id: user.id, full_name: user.user_metadata?.full_name || 'You', avatar_url: user.user_metadata?.avatar_url }
                        }
                        const profile = await profileService.getProfile(participantId)
                        return profile || { id: participantId, full_name: 'Unknown User' }
                    })
                )

                setChat(chatInfo)
                setMessages(chatMessages)
                setParticipants(participantProfiles)

                // Mark chat as read
                if (chatId && user?.id) {
                    try {
                        await chatService.markChatAsRead(chatId, user.id)
                    } catch (err) {
                        console.error('Error marking chat as read:', err)
                    }
                }
            } catch (err) {
                console.error('Error loading chat:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadChat()
    }, [chatId, user?.id])

    // Subscribe to new messages in realtime
    useEffect(() => {
        if (!chatId) return

        console.log('Setting up realtime subscription for chat:', chatId)

        const channel = chatService.subscribeToMessages(chatId, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new
                console.log('Realtime message received:', newMsg)

                setMessages(prev => {
                    // Avoid duplicates - check if message already exists
                    if (prev.some(m => m.id === newMsg.id)) {
                        console.log('Message already exists, skipping')
                        return prev
                    }

                    // Find sender profile from participants
                    const senderProfile = participants.find(p => p.id === newMsg.sender_id)
                    const messageWithProfile = {
                        ...newMsg,
                        profiles: senderProfile || null
                    }

                    console.log('Adding new realtime message to state')
                    return [...prev, messageWithProfile]
                })

                // Scroll to bottom after new message
                setTimeout(() => {
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
                    }
                }, 100)
            }
        })

        return () => {
            console.log('Cleaning up realtime subscription for chat:', chatId)
            if (channel && typeof channel.unsubscribe === 'function') {
                channel.unsubscribe()
            }
        }
    }, [chatId, participants])

    // Scroll to last message
    useEffect(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Handle message sending
    const handleSendMessage = async (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (!newMessage.trim() || !user?.id || !chatId) return

        try {
            setSending(true)

            // Send message to Supabase
            const message = await chatService.sendMessage(chatId, user.id, newMessage.trim())

            // Get sender profile info to attach to message
            const senderProfile = participants.find(p => p.id === user.id) || {
                id: user.id,
                full_name: user.user_metadata?.full_name,
                avatar_url: user.user_metadata?.avatar_url
            }

            // Add message to local state with profile info
            const messageWithProfile = {
                ...message,
                profiles: senderProfile
            }
            setMessages(prev => [...prev, messageWithProfile])
            setNewMessage('')

            // Scroll to bottom
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        } catch (err) {
            console.error('Error sending message:', err)
            const errorMessage = err?.message || 'Failed to send message. Please try again.'
            setError(errorMessage)

            // Clear error after 5 seconds
            setTimeout(() => {
                setError(null)
            }, 5000)
        } finally {
            setSending(false)
        }
    }

    // Get other participant (not current user)
    const otherParticipant = participants.find(p => p.id !== user?.id)
    const chatName = chat?.startup?.name || otherParticipant?.full_name || otherParticipant?.username || 'Unknown'
    const chatAvatar = chat?.startup?.logo_url || chat?.startup?.logo || otherParticipant?.avatar_url
    const chatGradient = chat?.startup?.gradient || 'bg-gradient-to-br from-purple-300 to-purple-700'

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const groups = []
        let currentDate = null
        let currentGroup = []

        messages.forEach((message, index) => {
            const messageDate = formatDate(message.created_at)
            if (messageDate !== currentDate) {
                if (currentGroup.length > 0) {
                    groups.push({ date: currentDate, messages: currentGroup })
                }
                currentDate = messageDate
                currentGroup = [message]
            } else {
                currentGroup.push(message)
            }
        })

        if (currentGroup.length > 0) {
            groups.push({ date: currentDate, messages: currentGroup })
        }

        return groups
    }

    const messageGroups = groupMessagesByDate(messages)

    if (loading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <div className="text-text-secondary mt-4">Loading conversation...</div>
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
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Chat</h2>
                            <p className="text-text-secondary mb-6">{error}</p>
                            <div className="flex gap-3 justify-center">
                                <button className="btn-secondary" onClick={() => navigate('/chat')}>
                                    <i className="fas fa-arrow-left mr-2"></i>
                                    Back to Chats
                                </button>
                                <button className="btn-primary" onClick={() => window.location.reload()}>
                                    <i className="fas fa-redo mr-2"></i>
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!chat) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Chat Not Found</h2>
                            <p className="text-text-secondary mb-8">The chat you're looking for doesn't exist or has been removed.</p>
                            <button className="btn-primary" onClick={() => navigate('/chat')}>
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Chats
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page" style={{ padding: 0, maxWidth: '100%', height: 'calc(100vh - 80px)' }}>
            <div className="flex flex-col h-full" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                {/* Chat Header */}
                <div className="desktop-page-section" style={{ marginBottom: 0, borderRadius: '0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                className="desktop-icon-btn"
                                onClick={() => navigate('/chat')}
                                title="Back to chats"
                            >
                                <i className="fa-solid fa-arrow-left"></i>
                            </button>
                            <div className={`w-12 h-12 ${chatGradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                {chatAvatar ? (
                                    <img src={chatAvatar} alt={chatName} className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <span>{chatName?.[0]?.toUpperCase() || 'C'}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">{chatName}</h2>
                                {chat?.startup && (
                                    <p className="text-sm text-text-secondary">Startup conversation</p>
                                )}
                                {!chat?.startup && otherParticipant && (
                                    <p className="text-sm text-text-secondary">Direct message</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="desktop-icon-btn" title="More options">
                                <i className="fa-solid fa-ellipsis"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto"
                    style={{
                        background: 'rgba(12, 13, 17, 0.5)',
                        padding: '24px',
                        minHeight: 0
                    }}
                >
                    {messageGroups.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="state-icon state-icon-sm state-icon-blue">
                                    <i className="fas fa-comments"></i>
                                </div>
                                <p className="text-text-secondary text-lg">No messages yet</p>
                                <p className="text-text-secondary text-sm mt-2">Start the conversation!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messageGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {/* Date separator */}
                                    <div className="flex items-center justify-center my-6">
                                        <div className="px-4 py-1 bg-bg-secondary/80 border border-glass-border rounded-full text-xs text-text-secondary">
                                            {group.date}
                                        </div>
                                    </div>

                                    {/* Messages in group */}
                                    <div className="space-y-4">
                                        {group.messages.map((message, index) => {
                                            const isOwnMessage = message.sender_id === user?.id
                                            const senderProfile = participants.find(p => p.id === message.sender_id)
                                            const showAvatar = index === 0 || group.messages[index - 1]?.sender_id !== message.sender_id

                                            return (
                                                <div
                                                    key={message.id}
                                                    id={`message-${message.id}`}
                                                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                                                >
                                                    {/* Avatar */}
                                                    {showAvatar && !isOwnMessage && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-300 to-purple-700 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                                                {senderProfile?.avatar_url ? (
                                                                    <img src={senderProfile.avatar_url} alt={senderProfile.full_name} className="w-full h-full rounded-xl object-cover" />
                                                                ) : (
                                                                    <span>{(senderProfile?.full_name || 'U')?.[0]?.toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {showAvatar && isOwnMessage && <div className="w-10"></div>}

                                                    {/* Message bubble */}
                                                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                        {showAvatar && !isOwnMessage && (
                                                            <span className="text-xs text-text-secondary mb-1 px-2">
                                                                {senderProfile?.full_name || senderProfile?.username || 'User'}
                                                            </span>
                                                        )}
                                                        <div
                                                            className={`px-4 py-3 rounded-2xl ${isOwnMessage
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md'
                                                                : 'bg-bg-secondary/80 border border-glass-border text-text-primary rounded-tl-md'
                                                                } shadow-lg hover:shadow-xl transition-all duration-200`}
                                                        >
                                                            <p className="leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
                                                            <div className={`flex items-center justify-end gap-2 mt-2 text-xs ${isOwnMessage ? 'text-white/70' : 'text-text-secondary'}`}>
                                                                <span>{formatMessageTime(message.created_at)}</span>
                                                                {isOwnMessage && (
                                                                    <i className="fa-solid fa-check text-xs"></i>
                                                                )}
                                                            </div>
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

                {/* Message Input */}
                <div className="desktop-page-section" style={{ marginTop: 0, borderRadius: '0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {error && error.includes('send') && (
                        <div className="mb-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                            <i className="fa-solid fa-exclamation-circle"></i>
                            <span>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-300"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3" noValidate>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full px-4 py-3 bg-bg-secondary/80 border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                                disabled={sending}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="desktop-icon-btn"
                            style={{ width: '48px', height: '48px' }}
                            title="Send message"
                        >
                            {sending ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fa-solid fa-paper-plane"></i>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default DesktopChatDetailPage

