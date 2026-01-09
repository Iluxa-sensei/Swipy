import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { authService, swipeService } from '../services'

const SettingsPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const clearProfile = () => {
        if (window.confirm('Are you sure you want to clear your saved profile data? This action cannot be undone.')) {
            try {
                localStorage.removeItem('profile_data')
                alert('Profile data cleared successfully')
            } catch (error) {
                console.error('Error clearing profile data:', error)
                alert('Failed to clear profile data')
            }
            navigate('/profile')
        }
    }

    const clearAll = () => {
        if (window.confirm('WARNING: This will delete ALL your local data including swipes, preferences, and settings. This action cannot be undone. Are you absolutely sure?')) {
            try {
                // Only clear app-specific data, not all localStorage
                const keysToRemove = [
                    'profile_data',
                    'swipes_data',
                    'filters_data',
                    'preferences_data'
                ]

                keysToRemove.forEach(key => {
                    if (localStorage.getItem(key)) {
                        localStorage.removeItem(key)
                    }
                })

                alert('App data cleared successfully')
            } catch (error) {
                console.error('Error clearing app data:', error)
                alert('Failed to clear app data')
            }
            navigate('/home')
        }
    }

    const clearSwipes = async () => {
        if (!user?.id) return

        if (window.confirm('Clear all your likes and passes? This action cannot be undone.')) {
            try {
                // Get all swipes and remove them
                const { likes, passes } = await swipeService.getUserLikes(user.id)
                const allSwipes = [...likes, ...passes]

                await Promise.all(allSwipes.map(swipe =>
                    swipeService.removeSwipe(user.id, swipe.startup_id)
                ))

                alert('All swipes cleared successfully')
                navigate('/saved')
            } catch (error) {
                console.error('Error clearing swipes:', error)
                alert('Failed to clear swipes. Please try again.')
            }
        }
    }

    const signOut = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            try {
                await authService.signOut()
                // Clear sensitive data on sign out
                try {
                    localStorage.removeItem('profile_data')
                    localStorage.removeItem('swipes_data')
                } catch (error) {
                    console.error('Error clearing data on sign out:', error)
                }
                navigate('/login')
            } catch (error) {
                console.error('Error signing out:', error)
                alert('Failed to sign out. Please try again.')
            }
        }
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Settings</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-6 space-y-4 pb-20">
                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Profile</h3>
                    <button className="btn-secondary w-full" onClick={() => navigate('/profile/edit')}>
                        <i className="fas fa-user-edit"></i>
                        Edit Profile
                    </button>
                    <div className="h-3"></div>
                    <button className="btn-secondary w-full" onClick={() => navigate('/activity-dashboard')}>
                        <i className="fas fa-chart-line"></i>
                        Activity Dashboard
                    </button>
                    <div className="h-3"></div>
                    <button className="btn-secondary w-full" onClick={() => navigate('/support')}>
                        <i className="fas fa-headset"></i>
                        Support
                    </button>
                    <div className="h-3"></div>
                    <button className="btn-secondary w-full" onClick={clearProfile}>
                        <i className="fas fa-trash"></i>
                        Clear Saved Profile
                    </button>
                    <div className="h-3"></div>
                    <button className="btn-secondary w-full" onClick={signOut}>
                        <i className="fas fa-sign-out-alt"></i>
                        Sign out
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Discover</h3>
                    <button className="btn-secondary w-full" onClick={clearSwipes}>
                        <i className="fas fa-undo"></i>
                        Clear Likes/Passes
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Danger Zone</h3>
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95" onClick={clearAll}>
                        <i className="fas fa-bomb"></i>
                        Reset App Data
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage






