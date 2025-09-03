import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '../data/notifications'

const NotificationsPage = () => {
  const [notificationsList, setNotificationsList] = useState(notifications)
  const navigate = useNavigate()

  const markAllRead = () => {
    setNotificationsList(prev =>
      prev.map(notification => ({ ...notification, unread: false }))
    )
  }

  const clearAllNotifications = () => {
    setNotificationsList([])
  }

  const openNotification = (notification) => {
    // Here you can add logic for opening notification

          // Mark as read
    setNotificationsList(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, unread: false } : n
      )
    )
  }

  const goBack = () => {
    navigate('/home')
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
              <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-bell text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">No Notifications</h2>
              <p className="text-text-secondary">You're all caught up!</p>
            </div>
          </div>
        ) : (
          notificationsList.map((notification, index) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.unread ? 'unread' : ''} animate-slide-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-icon">
                <i className={notification.icon}></i>
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
                  <span className="notification-time">{notification.time}</span>
                </div>
                <p className="notification-text">{notification.text}</p>
                <div className="notification-badges">
                  {notification.badges.map((badge, index) => (
                    <span key={index} className="notification-badge">{badge}</span>
                  ))}
                </div>
              </div>
              <div className="notification-status">
                <div className={notification.unread ? 'unread-dot' : 'read-dot'}></div>
              </div>
            </div>
          ))
        )}
      </div>

      {notificationsList.length > 0 && (
        <div className="notifications-actions">
          <button className="btn-secondary" onClick={markAllRead}>
            <i className="fas fa-check-double"></i>
            Mark All Read
          </button>
          <button className="btn-primary" onClick={clearAllNotifications}>
            <i className="fas fa-trash"></i>
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
