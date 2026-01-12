import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { notificationService } from '../services'
import { supabase } from '../services/supabaseClient'

const NotificationsPage = () => {
  const [notificationsList, setNotificationsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startupNames, setStartupNames] = useState({})
  const [startupSlugs, setStartupSlugs] = useState({})
  const [userNames, setUserNames] = useState({})
  const navigate = useNavigate()
  const { user } = useAuth()

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const notifications = await notificationService.getUserNotifications(user.id)
        setNotificationsList(notifications)

        // Extract unique startup IDs and user IDs from notifications
        const startupIds = new Set()
        const userIds = new Set()

        notifications.forEach(notification => {
          if (notification.data?.startup_id) {
            startupIds.add(notification.data.startup_id)
          }
          if (notification.data?.matched_user_id) {
            userIds.add(notification.data.matched_user_id)
          }
        })

        // Load startup names and slugs
        if (startupIds.size > 0) {
          const { data: startups, error: startupsError } = await supabase
            .from('startups')
            .select('id, name, slug, profiles!startups_owner_id_fkey(username)')
            .in('id', Array.from(startupIds))

          if (!startupsError && startups) {
            const namesMap = {}
            const slugsMap = {}
            startups.forEach(startup => {
              namesMap[startup.id] = startup.name
              slugsMap[startup.id] = {
                slug: startup.slug,
                owner_nickname: startup.profiles?.username
              }
            })
            setStartupNames(namesMap)
            setStartupSlugs(slugsMap)
          }
        }

        // Load user names
        if (userIds.size > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .in('id', Array.from(userIds))

          if (!profilesError && profiles) {
            const namesMap = {}
            profiles.forEach(profile => {
              namesMap[profile.id] = profile.full_name || profile.username || 'Unknown User'
            })
            setUserNames(namesMap)
          }
        }
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
      // Delete all notifications
      await Promise.all(notificationsList.map(notification =>
        notificationService.deleteNotification(notification.id)
      ))
      setNotificationsList([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  const openNotification = async (notification) => {
    // Mark as read if unread
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

    // Handle navigation based on notification type
    if (notification.type === 'like' && notification.data?.startup_id) {
      const startupInfo = startupSlugs[notification.data.startup_id]
      if (startupInfo?.slug && startupInfo?.owner_nickname) {
        navigate(`/${startupInfo.owner_nickname}/startup/${startupInfo.slug}`)
      } else {
      navigate(`/startup/${notification.data.startup_id}`)
      }
    } else if (notification.type === 'match' && notification.data?.matched_user_id) {
      // Navigate to chat or profile
      navigate('/chats')
    }
  }

  const goBack = () => {
    navigate('/home')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Notifications</h1>
          <button className="header-btn">
            <i className="fas fa-check-double"></i>
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Notifications</h2>
            <p className="text-text-secondary">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Notifications</h1>
          <button className="header-btn">
            <i className="fas fa-check-double"></i>
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Notifications</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200 hover:scale-100 active:scale-100"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={goBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Notifications</h1>
        <button className="header-btn" onClick={markAllRead}>
          <i className="fas fa-check-double"></i>
        </button>
      </div>

      <div className="notifications-content pb-20">
        {notificationsList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-bell text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">No Notifications</h2>
              <p className="text-text-secondary mb-8">Notifications will appear here when you interact with startups.</p>
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200 hover:scale-100 active:scale-100"
                onClick={() => navigate('/home')}
              >
                Browse Startups
              </button>
            </div>
          </div>
        ) : (
          notificationsList.map((notification, index) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''} animate-slide-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-icon">
                <i className={getNotificationIcon(notification.type)}></i>
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
                  <span className="notification-time">{formatNotificationTime(notification.created_at)}</span>
                </div>
                <p className="notification-text">{notification.message}</p>
                {notification.data && (
                  <div className="notification-badges">
                    {notification.data.startup_id && startupNames[notification.data.startup_id] && (
                      <span className="notification-badge">
                        Startup: {startupNames[notification.data.startup_id]}
                      </span>
                    )}
                    {notification.data.matched_user_id && userNames[notification.data.matched_user_id] && (
                      <span className="notification-badge">
                        User: {userNames[notification.data.matched_user_id]}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="notification-status">
                <div className={!notification.read ? 'unread-dot' : 'read-dot'}></div>
              </div>
            </div>
          ))
        )}
      </div>

      {notificationsList.length > 0 && (
        <div className="notifications-actions">
          <button className="btn-secondary rounded-full hover:scale-100 active:scale-100" onClick={markAllRead}>
            <i className="fas fa-check-double"></i>
            Mark All Read
          </button>
          <button className="btn-primary rounded-full hover:scale-100 active:scale-100" onClick={clearAllNotifications}>
            <i className="fas fa-trash"></i>
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function to get notification icon
const getNotificationIcon = (type) => {
  const iconMap = {
    'like': 'fas fa-heart',
    'match': 'fas fa-star',
    'message': 'fas fa-comment',
    'system': 'fas fa-info-circle'
  }
  return iconMap[type] || 'fas fa-bell'
}

// Helper function to format notification time
const formatNotificationTime = (createdAt) => {
  const now = new Date()
  const created = new Date(createdAt)
  const diffInMinutes = Math.floor((now - created) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

export default NotificationsPage
