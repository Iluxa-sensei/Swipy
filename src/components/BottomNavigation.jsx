import React from 'react'
import { useNavigate } from 'react-router-dom'

const BottomNavigation = ({ currentScreen, onScreenChange }) => {
  const navigate = useNavigate()

      // Get user role from localStorage
  const getUserRole = () => {
    try {
      const profileData = localStorage.getItem('profile_data')
      if (profileData) {
        const profile = JSON.parse(profileData)
        return profile.role || 'founder'
      }
    } catch (error) {
      console.error('Error getting user role:', error)
    }
    return 'founder'
  }

  const userRole = getUserRole()

  const navItems = [
    { id: 'home', icon: 'fas fa-fire', label: 'Home', path: '/home' },
    ...(userRole === 'founder' ? [{ id: 'add', icon: 'fas fa-plus', label: 'Add', path: '/add' }] : []),
    { id: 'chat', icon: 'fas fa-comments', label: 'Chat', path: '/chat' },
    { id: 'profile', icon: 'fas fa-user', label: 'Profile', path: '/profile' }
  ]

  const handleNavClick = (item) => {
    onScreenChange(item.id)
    navigate(item.path)
  }

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
          onClick={() => handleNavClick(item)}
        >
          <i className={`${item.icon} ${currentScreen === item.id && item.id === 'home' ? 'animate-fire' : ''}`}></i>
        </div>
      ))}
    </div>
  )
}

export default BottomNavigation
