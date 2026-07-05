import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { authService, swipeService } from '../services'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const SettingsPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [confirmDialog, setConfirmDialog] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (message, isError = false) => {
        setToast({ message, isError })
        setTimeout(() => setToast(null), 2500)
    }

    const closeConfirm = () => {
        if (!isProcessing) setConfirmDialog(null)
    }

    const clearProfile = () => {
        setConfirmDialog({
            title: 'Clear Saved Profile',
            message: 'Are you sure you want to clear your saved profile data? This action cannot be undone.',
            confirmLabel: 'Clear',
            danger: true,
            onConfirm: async () => {
                setIsProcessing(true)
                try {
                    localStorage.removeItem('profile_data')
                    setConfirmDialog(null)
                    showToast('Profile data cleared successfully')
                    navigate('/profile')
                } catch (error) {
                    console.error('Error clearing profile data:', error)
                    showToast('Failed to clear profile data', true)
                } finally {
                    setIsProcessing(false)
                }
            },
        })
    }

    const clearAll = () => {
        setConfirmDialog({
            title: 'Reset App Data',
            message: 'This will delete ALL your local data including swipes, preferences, and settings. This action cannot be undone.',
            confirmLabel: 'Reset',
            danger: true,
            onConfirm: async () => {
                setIsProcessing(true)
                try {
                    const keysToRemove = [
                        'profile_data',
                        'swipes_data',
                        'filters_data',
                        'preferences_data',
                    ]
                    keysToRemove.forEach(key => {
                        if (localStorage.getItem(key)) {
                            localStorage.removeItem(key)
                        }
                    })
                    setConfirmDialog(null)
                    showToast('App data cleared successfully')
                    navigate('/home')
                } catch (error) {
                    console.error('Error clearing app data:', error)
                    showToast('Failed to clear app data', true)
                } finally {
                    setIsProcessing(false)
                }
            },
        })
    }

    const clearSwipes = () => {
        if (!user?.id) {
            showToast('Please sign in to clear swipes', true)
            return
        }

        setConfirmDialog({
            title: 'Clear Likes/Passes',
            message: 'Clear all your likes and passes? This action cannot be undone.',
            confirmLabel: 'Clear',
            danger: true,
            onConfirm: async () => {
                setIsProcessing(true)
                try {
                    const [likes, passes] = await Promise.all([
                        swipeService.getUserLikes(user.id),
                        swipeService.getUserPasses(user.id),
                    ])
                    const allSwipes = [...likes, ...passes]

                    await Promise.all(allSwipes.map(swipe =>
                        swipeService.removeSwipe(user.id, swipe.startup_id)
                    ))

                    localStorage.removeItem('swipes_data')
                    setConfirmDialog(null)
                    showToast('All swipes cleared successfully')
                    navigate('/saved')
                } catch (error) {
                    console.error('Error clearing swipes:', error)
                    showToast('Failed to clear swipes. Please try again.', true)
                } finally {
                    setIsProcessing(false)
                }
            },
        })
    }

    const signOut = () => {
        setConfirmDialog({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            confirmLabel: 'Sign Out',
            danger: true,
            onConfirm: async () => {
                setIsProcessing(true)
                try {
                    await authService.signOut()
                    try {
                        localStorage.removeItem('profile_data')
                        localStorage.removeItem('swipes_data')
                    } catch (error) {
                        console.error('Error clearing data on sign out:', error)
                    }
                    setConfirmDialog(null)
                    navigate('/login')
                } catch (error) {
                    console.error('Error signing out:', error)
                    showToast('Failed to sign out. Please try again.', true)
                } finally {
                    setIsProcessing(false)
                }
            },
        })
    }

    return (
        <div className="screen active">
            <div className="header">
                <button type="button" className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Settings</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-6 space-y-4 pb-20 overflow-y-auto">
                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Profile</h3>
                    <button type="button" className="btn-secondary w-full" onClick={() => navigate('/profile/edit')}>
                        <i className="fas fa-user-edit"></i>
                        Edit Profile
                    </button>
                    <div className="h-3"></div>
                    <button type="button" className="btn-secondary w-full" onClick={() => navigate('/activity-dashboard')}>
                        <i className="fas fa-chart-line"></i>
                        Activity Dashboard
                    </button>
                    <div className="h-3"></div>
                    <button type="button" className="btn-secondary w-full" onClick={() => navigate('/support')}>
                        <i className="fas fa-headset"></i>
                        Support
                    </button>
                    <div className="h-3"></div>
                    <button type="button" className="btn-secondary w-full" onClick={clearProfile}>
                        <i className="fas fa-trash"></i>
                        Clear Saved Profile
                    </button>
                    <div className="h-3"></div>
                    <button type="button" className="btn-secondary w-full" onClick={signOut}>
                        <i className="fas fa-sign-out-alt"></i>
                        Sign out
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Discover</h3>
                    <button type="button" className="btn-secondary w-full" onClick={clearSwipes}>
                        <i className="fas fa-undo"></i>
                        Clear Likes/Passes
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Danger Zone</h3>
                    <button
                        type="button"
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                        onClick={clearAll}
                    >
                        <i className="fas fa-bomb"></i>
                        Reset App Data
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={!!confirmDialog}
                title={confirmDialog?.title}
                message={confirmDialog?.message}
                confirmLabel={confirmDialog?.confirmLabel}
                danger={confirmDialog?.danger}
                loading={isProcessing}
                onConfirm={() => confirmDialog?.onConfirm?.()}
                onCancel={closeConfirm}
            />

            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] max-w-[90vw]">
                    <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium ${toast.isError ? 'bg-red-500/90 border-red-400 text-white' : 'bg-bg-secondary/95 border-glass-border text-text-primary'}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SettingsPage
