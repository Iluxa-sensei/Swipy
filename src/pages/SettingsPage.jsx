import React from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSwipes } from '../data/swipes'

const SettingsPage = () => {
    const navigate = useNavigate()

    const clearProfile = () => {
        try { localStorage.removeItem('profile_data') } catch { }
        navigate('/profile')
    }

    const clearAll = () => {
        try { localStorage.clear() } catch { }
        navigate('/home')
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
                    <button className="btn-secondary w-full" onClick={clearProfile}>
                        <i className="fas fa-trash"></i>
                        Clear Saved Profile
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Discover</h3>
                    <button className="btn-secondary w-full" onClick={() => { clearSwipes(); navigate('/saved') }}>
                        <i className="fas fa-undo"></i>
                        Clear Likes/Passes
                    </button>
                </div>

                <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                    <h3 className="text-text-primary font-semibold mb-2">Danger Zone</h3>
                    <button className="btn-primary w-full" onClick={clearAll}>
                        <i className="fas fa-bomb"></i>
                        Reset App Data
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage






