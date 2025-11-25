import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'

const NAV_ITEMS = [
    { id: 'home', label: 'News', icon: 'fa-regular fa-newspaper', path: '/home' },
    { id: 'chat', label: 'Chats', icon: 'fa-regular fa-comments', path: '/chat' },
    { id: 'saved', label: 'Saved', icon: 'fa-regular fa-bookmark', path: '/saved' },
    { id: 'notifications', label: 'Alerts', icon: 'fa-regular fa-bell', path: '/notifications' },
    { id: 'activity-dashboard', label: 'Insights', icon: 'fa-solid fa-chart-simple', path: '/activity-dashboard' },
    { id: 'profile', label: 'Profile', icon: 'fa-regular fa-user', path: '/profile' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', path: '/settings' }
]

const DesktopLayout = ({ children, currentScreen = 'home', onScreenChange, minimal = false }) => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const handleNavClick = (item) => {
        if (onScreenChange) {
            onScreenChange(item.id)
        } else {
            navigate(item.path)
        }
    }

    if (minimal) {
        return (
            <div className="desktop-minimal-wrapper">
                {children}
            </div>
        )
    }

    return (
        <div className="desktop-shell">
            <aside className="desktop-sidebar compact">
                <div className="sidebar-logo">
                    <img src="/Vector.png" alt="Swipy" />
                </div>
                <nav className="desktop-nav compact">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`desktop-nav-icon ${currentScreen === item.id || currentScreen?.startsWith(item.id)
                                ? 'active'
                                : ''}`}
                            onClick={() => handleNavClick(item)}
                            title={item.label}
                        >
                            <i className={item.icon}></i>
                        </button>
                    ))}
                </nav>
                <button
                    type="button"
                    className="desktop-nav-icon"
                    onClick={() => navigate('/settings')}
                    title="Settings"
                >
                    <i className="fa-solid fa-gear"></i>
                </button>
            </aside>

            <div className="desktop-main">
                <header className="desktop-header modern">
                    <div className="desktop-header-title">
                        <p className="desktop-header-eyebrow">Startup news</p>
                        <h1>Startups</h1>
                    </div>
                    <div className="desktop-header-actions wide">
                        <div className="desktop-search wide">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input type="search" placeholder="Search" />
                        </div>
                        <button type="button" className="desktop-icon-btn" onClick={() => navigate('/notifications')}>
                            <i className="fa-regular fa-bell"></i>
                        </button>
                        <button type="button" className="desktop-icon-btn" onClick={() => navigate('/chat')}>
                            <i className="fa-regular fa-comment-dots"></i>
                        </button>
                        <div className="desktop-user-pill">
                            <div className="user-meta">
                                <p className="user-name">{user?.full_name || 'Investor'}</p>
                                <p className="user-role">{user?.user_metadata?.role || 'Founder'}</p>
                            </div>
                            <div className="user-avatar">
                                {user?.avatar_url
                                    ? <img src={user.avatar_url} alt={user.full_name || 'Profile'} />
                                    : <span>{user?.full_name?.[0]?.toUpperCase() || '?'}</span>}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="desktop-content-area">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DesktopLayout

