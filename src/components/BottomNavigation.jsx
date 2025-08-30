import React from 'react'
import { useNavigate } from 'react-router-dom'

const BottomNavigation = ({ currentScreen, onScreenChange }) => {
  const navigate = useNavigate()

  const navItems = [
    { id: 'home', icon: 'fas fa-fire', label: 'Home', path: '/home' },
    { id: 'filters', icon: 'fas fa-search', label: 'Search', path: '/filters' },
    { id: 'add', icon: 'fas fa-plus', label: 'Add', path: '/add' },
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
