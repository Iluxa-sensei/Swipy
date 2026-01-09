import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { authService, swipeService } from '../services'

const DesktopSettingsPage = () => {
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
                const likes = await swipeService.getUserLikes(user.id)
                const passes = await swipeService.getUserPasses(user.id)
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

    const settingsGroups = [
        {
            title: 'Profile',
            items: [
                {
                    icon: 'fas fa-user-edit',
                    label: 'Edit Profile',
                    action: () => navigate('/profile/edit'),
                    color: 'text-blue-400'
                },
                {
                    icon: 'fas fa-chart-line',
                    label: 'Activity Dashboard',
                    action: () => navigate('/activity-dashboard'),
                    color: 'text-purple-400'
                },
                {
                    icon: 'fas fa-headset',
                    label: 'Support',
                    action: () => navigate('/support'),
                    color: 'text-green-400'
                },
                {
                    icon: 'fas fa-trash',
                    label: 'Clear Saved Profile',
                    action: clearProfile,
                    color: 'text-orange-400'
                },
                {
                    icon: 'fas fa-sign-out-alt',
                    label: 'Sign Out',
                    action: signOut,
                    color: 'text-red-400'
                }
            ]
        },
        {
            title: 'Discover',
            items: [
                {
                    icon: 'fas fa-undo',
                    label: 'Clear Likes/Passes',
                    action: clearSwipes,
                    color: 'text-yellow-400'
                }
            ]
        },
        {
            title: 'Danger Zone',
            items: [
                {
                    icon: 'fas fa-bomb',
                    label: 'Reset App Data',
                    action: clearAll,
                    color: 'text-red-500',
                    danger: true
                }
            ]
        }
    ]

    return (
        <div className="desktop-page">

            <div className="desktop-grid desktop-grid-3">
                {settingsGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="desktop-page-section">
                        <div className="desktop-page-section-header">
                            <h2>{group.title}</h2>
                        </div>
                        <div className="space-y-3">
                            {group.items.map((item, itemIndex) => (
                                <button
                                    key={itemIndex}
                                    className={`w-full desktop-card text-left ${item.danger ? 'hover:border-red-500/50' : ''}`}
                                    onClick={item.action}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.danger ? 'bg-red-500/20 border border-red-500/30' : 'bg-bg-secondary/80 border border-glass-border'}`}>
                                            <i className={`${item.icon} ${item.color} text-lg`}></i>
                                        </div>
                                        <span className={`font-medium ${item.danger ? 'text-red-400' : 'text-text-primary'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DesktopSettingsPage

