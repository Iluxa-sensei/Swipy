import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { profileServiceEnhanced } from '../services/profileServiceEnhanced'

const DesktopProfilePage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)
    const [activeTab, setActiveTab] = useState('profile')
    const [completeProfile, setCompleteProfile] = useState(null)
    const [loadingComplete, setLoadingComplete] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/login')
        }
    }, [user, navigate])

    useEffect(() => {
        if (user?.id && profile) {
            loadCompleteProfile()
        }
    }, [user?.id, profile])

    const loadCompleteProfile = async () => {
        setLoadingComplete(true)
        try {
            const data = await profileServiceEnhanced.getCompleteProfile(user.id)
            setCompleteProfile(data)
        } catch (error) {
            console.error('Error loading complete profile:', error)
        } finally {
            setLoadingComplete(false)
        }
    }

    const hasProfile = profile && profile.full_name
    const userRole = profile?.role || 'founder'

    const userProfile = hasProfile ? {
        name: profile.full_name,
        username: profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '_') || 'user',
        title: profile.title || profile.role || 'Founder',
        avatar: profile.full_name?.charAt(0)?.toUpperCase() + (profile.full_name?.split(' ')[1]?.charAt(0)?.toUpperCase() || ''),
        location: profile.location,
        bio: profile.bio,
        avatarUrl: profile.avatar_url || null,
    } : null

    const stats = [
        { label: "Profile Views", value: profile?.profile_views || "0", icon: "fas fa-eye" },
        { label: "Matches", value: profile?.matches || "0", icon: "fas fa-heart" },
        { label: "Applications", value: profile?.applications || "0", icon: "fas fa-paper-plane" },
        { label: "Days Active", value: profile?.days_active || "0", icon: "fas fa-calendar" }
    ]

    if (profileLoading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-user text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading profile...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (profileError) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Profile</h2>
                            <p className="text-text-secondary mb-6">{profileError}</p>
                            <button className="btn-primary" onClick={() => window.location.reload()}>
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!hasProfile) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-user-plus text-5xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Create Your Profile</h2>
                            <p className="text-text-secondary mb-8">Build your professional profile to connect with amazing startups.</p>
                            <button className="btn-primary" onClick={() => navigate('/profile/edit')}>
                                <i className="fas fa-plus mr-2"></i>
                                Create Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            {/* Profile Header Card */}
            <div className="desktop-page-section">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        {userProfile.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-accent-primary/30" />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                                {userProfile.avatar}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-text-primary mb-2">{userProfile.name}</h2>
                        <p className="text-accent-primary text-lg font-semibold mb-3">@{userProfile.username}</p>
                        {userProfile.title && (
                            <p className="text-text-secondary mb-4">{userProfile.title}</p>
                        )}
                        {userProfile.location && (
                            <p className="text-text-secondary flex items-center gap-2">
                                <i className="fas fa-map-marker-alt"></i>
                                {userProfile.location}
                            </p>
                        )}
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/profile/edit')}>
                        <i className="fas fa-edit mr-2"></i>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="desktop-page-section">
                <div className="desktop-page-section-header">
                    <h2>Statistics</h2>
                </div>
                <div className="desktop-grid desktop-grid-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="desktop-card">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-300 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                                <i className={`${stat.icon} text-white text-xl`}></i>
                            </div>
                            <div className="text-3xl font-bold text-text-primary mb-2">{stat.value}</div>
                            <div className="text-sm text-text-secondary font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bio */}
            {userProfile.bio && (
                <div className="desktop-page-section">
                    <div className="desktop-page-section-header">
                        <h2>About</h2>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{userProfile.bio}</p>
                </div>
            )}

            {/* Social Links */}
            {(profile?.github_url || profile?.linkedin_url || profile?.website || profile?.instagram_url) && (
                <div className="desktop-page-section">
                    <div className="desktop-page-section-header">
                        <h2>Social Links</h2>
                    </div>
                    <div className="flex gap-4">
                        {profile?.github_url && (
                            <a className="desktop-card cursor-pointer hover:border-blue-500/50" href={profile.github_url} target="_blank" rel="noreferrer">
                                <div className="flex items-center gap-3">
                                    <i className="fab fa-github text-2xl text-text-primary"></i>
                                    <span className="font-medium text-text-primary">GitHub</span>
                                </div>
                            </a>
                        )}
                        {profile?.linkedin_url && (
                            <a className="desktop-card cursor-pointer hover:border-blue-500/50" href={profile.linkedin_url} target="_blank" rel="noreferrer">
                                <div className="flex items-center gap-3">
                                    <i className="fab fa-linkedin text-2xl text-blue-400"></i>
                                    <span className="font-medium text-text-primary">LinkedIn</span>
                                </div>
                            </a>
                        )}
                        {profile?.instagram_url && (
                            <a className="desktop-card cursor-pointer hover:border-pink-500/50" href={profile.instagram_url} target="_blank" rel="noreferrer">
                                <div className="flex items-center gap-3">
                                    <i className="fab fa-instagram text-2xl text-pink-400"></i>
                                    <span className="font-medium text-text-primary">Instagram</span>
                                </div>
                            </a>
                        )}
                        {profile?.website && (
                            <a className="desktop-card cursor-pointer hover:border-accent-primary/50" href={profile.website} target="_blank" rel="noreferrer">
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-globe text-2xl text-accent-primary"></i>
                                    <span className="font-medium text-text-primary">Website</span>
                                </div>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DesktopProfilePage

