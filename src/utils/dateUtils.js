// Format message time for display
export const formatMessageTime = (timestamp) => {
    if (!timestamp) return 'Just now'

    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`

    // If more than 24 hours, show date
    const isToday = now.toDateString() === messageTime.toDateString()
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageTime.toDateString()

    if (isToday) return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isYesterday) return 'Yesterday'

    return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// Format date for display
export const formatDate = (date) => {
    if (!date) return ''

    const now = new Date()
    const targetDate = new Date(date)
    const diffInDays = Math.floor((now - targetDate) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`

    return targetDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Check if date is recent (within last 24 hours)
export const isRecent = (date) => {
    if (!date) return false

    const now = new Date()
    const targetDate = new Date(date)
    const diffInHours = (now - targetDate) / (1000 * 60 * 60)

    return diffInHours < 24
}
