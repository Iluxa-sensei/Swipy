import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { notificationService } from '../services'

const DesktopNotificationsPage = () => {
    const [notificationsList, setNotificationsList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        const loadNotifications = async () => {
            if (!user?.id) return
            try {
                setLoading(true)
                const notifications = await notificationService.getUserNotifications(user.id)
                setNotificationsList(notifications)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadNotifications()
    }, [user?.id])

    const markAllRead = async () => {
        if (!user?.id) return
        try {
            await notificationService.markAllAsRead(user.id)
            setNotificationsList(prev => prev.map(notification => ({ ...notification, read: true })))
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const clearAllNotifications = async () => {
        if (!user?.id) return
        try {
            await Promise.all(notificationsList.map(notification =>
                notificationService.deleteNotification(notification.id)
            ))
            setNotificationsList([])
        } catch (error) {
            console.error('Error clearing notifications:', error)
        }
    }

    const openNotification = async (notification) => {
        if (!notification.read) {
            try {
                await notificationService.markAsRead(notification.id)
                setNotificationsList(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                    )
                )
            } catch (error) {
                console.error('Error marking notification as read:', error)
            }
        }

        if (notification.type === 'like' && notification.data?.startup_id) {
            navigate(`/startup/${notification.data.startup_id}`)
        } else if (notification.type === 'match' && notification.data?.matched_user_id) {
            navigate('/chat')
        }
    }

    const getNotificationIcon = (type) => {
        const iconMap = {
            'like': 'fas fa-heart',
            'match': 'fas fa-star',
            'message': 'fas fa-comment',
            'system': 'fas fa-info-circle'
        }
        return iconMap[type] || 'fas fa-bell'
    }

    const formatNotificationTime = (createdAt) => {
        const now = new Date()
        const created = new Date(createdAt)
        const diffInMinutes = Math.floor((now - created) / (1000 * 60))
        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
        return `${Math.floor(diffInMinutes / 1440)}d ago`
    }

    if (loading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-bell text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading notifications...</div>
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
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Notifications</h2>
                            <p className="text-text-secondary mb-6">{error}</p>
                            <button className="btn-primary" onClick={() => window.location.reload()}>
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
            {notificationsList.length > 0 && (
                <div className="mb-6 flex justify-end gap-3">
                    <button className="btn-secondary" onClick={markAllRead}>
                        <i className="fas fa-check-double mr-2"></i>
                        Mark All Read
                    </button>
                    <button className="btn-primary" onClick={clearAllNotifications}>
                        <i className="fas fa-trash mr-2"></i>
                        Clear All
                    </button>
                </div>
            )}

            {notificationsList.length === 0 ? (
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-bell text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">No Notifications</h2>
                            <p className="text-text-secondary mb-8">Notifications will appear here when you interact with startups.</p>
                            <button className="btn-primary" onClick={() => navigate('/home')}>
                                Browse Startups
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="desktop-grid desktop-grid-2">
                    {notificationsList.map((notification) => (
                        <div
                            key={notification.id}
                            className={`desktop-card cursor-pointer group ${!notification.read ? 'border-accent-primary/50 bg-accent-primary/5' : ''}`}
                            onClick={() => openNotification(notification)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${!notification.read
                                        ? 'bg-gradient-to-r from-blue-300 to-blue-700'
                                        : 'bg-bg-secondary/80 border border-glass-border'
                                    }`}>
                                    <i className={`${getNotificationIcon(notification.type)} ${!notification.read ? 'text-white' : 'text-text-secondary'}`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`text-lg font-semibold ${!notification.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-accent-primary rounded-full flex-shrink-0 ml-2"></div>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">{notification.message}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">{formatNotificationTime(notification.created_at)}</span>
                                        {notification.data && (
                                            <div className="flex gap-2">
                                                {Object.entries(notification.data).slice(0, 2).map(([key, value]) => (
                                                    <span key={key} className="px-2 py-1 bg-bg-secondary/80 border border-glass-border rounded-lg text-xs text-text-secondary">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DesktopNotificationsPage

