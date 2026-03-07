import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { profileServiceEnhanced } from '../services/profileServiceEnhanced'
import Loader from '../components/Loader.jsx'

const DesktopProfilePage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)
    const [activeTab, setActiveTab] = useState('profile')
    const [isOnline, setIsOnline] = useState(true)
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

    const getProfileCompletion = () => {
        if (!profile) return 0
        const fields = ['full_name', 'username', 'bio', 'location', 'avatar_url', 'role', 'website']
        const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '').length
        const interestsFilled = profile.interests && profile.interests.length > 0 ? 1 : 0
        return Math.round(((filled + interestsFilled) / (fields.length + 1)) * 100)
    }

    const profileCompletion = getProfileCompletion()


    if (profileLoading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <div className="text-text-secondary mt-4">Loading profile...</div>
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
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
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
                            <div className="state-icon state-icon-blue">
                                <i className="fas fa-user-plus"></i>
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
            {/* Profile Header - Compact and Modern */}
            <div className="desktop-page-section !pb-6">
                <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                        {userProfile.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-accent-primary/20 shadow-lg" />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-2 border-accent-primary/20 shadow-lg">
                                {userProfile.avatar}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-[#1a1b23] w-6 h-6 rounded-full shadow-md"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold text-text-primary truncate">{userProfile.name}</h2>
                            <span className="px-2.5 py-0.5 bg-accent-primary/15 text-accent-primary rounded-md text-[10px] font-bold uppercase tracking-wider border border-accent-primary/30">
                                {userRole}
                            </span>
                        </div>
                        <p className="text-accent-primary text-base font-semibold mb-2">@{userProfile.username}</p>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                            {userProfile.title && (
                                <div className="flex items-center gap-1.5">
                                    <i className="fas fa-briefcase text-accent-primary text-xs"></i>
                                    <span>{userProfile.title}</span>
                                </div>
                            )}
                            {userProfile.location && (
                                <div className="flex items-center gap-1.5">
                                    <i className="fas fa-map-marker-alt text-accent-primary text-xs"></i>
                                    <span>{userProfile.location}</span>
                                </div>
                            )}
                        </div>
                        {/* Profile completion */}
                        <div className="mt-4 max-w-xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                                    Profile completeness
                                </span>
                                <span className="text-xs font-semibold text-accent-primary">
                                    {profileCompletion}%
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-bg-secondary/80 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500 transition-all duration-500"
                                    style={{ width: `${profileCompletion}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button className="btn-secondary py-2.5 px-6 rounded-xl text-sm" onClick={async () => {
                            const shareData = {
                                title: `${userProfile.name} — ${userProfile.title}`,
                                text: userProfile.bio || `Check out ${userProfile.name}'s profile on Swipy`,
                                url: window.location.origin + `/profile/${profile?.username || user?.id}`
                            }
                            try {
                                if (navigator.share) {
                                    await navigator.share(shareData)
                                } else {
                                    await navigator.clipboard.writeText(shareData.url)
                                    alert('Profile link copied to clipboard')
                                }
                            } catch (e) {
                                try {
                                    await navigator.clipboard.writeText(shareData.url)
                                    alert('Profile link copied to clipboard')
                                } catch { }
                            }
                        }}>
                            <i className="fas fa-share mr-2"></i>
                            Share Profile
                        </button>
                        <button className="btn-primary py-2.5 px-6 rounded-xl text-sm" onClick={() => navigate('/profile/edit')}>
                            <i className="fas fa-edit mr-2"></i>
                            Edit Profile
                        </button>
                        <button className="btn-secondary py-2.5 px-6 rounded-xl text-sm" onClick={() => navigate('/settings')}>
                            <i className="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation - Cleaner */}
            <div className="desktop-page-section !py-0 !px-0 border-b border-glass-border bg-bg-primary/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex max-w-3xl mx-auto">
                    {['profile', 'portfolio', 'achievements'].map((tab) => {
                        if (userRole === 'investor' && tab !== 'profile') return null;

                        return (
                            <button
                                key={tab}
                                className={`flex-1 py-4 px-6 text-center transition-all duration-200 relative ${activeTab === tab
                                    ? 'text-accent-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <i className={`${tab === 'profile' ? 'fas fa-user' :
                                        tab === 'portfolio' ? 'fas fa-briefcase' :
                                            'fas fa-trophy'
                                        } text-base`}></i>
                                    <span className="font-semibold">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                </div>
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"></div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Main Content — Masonry-style adaptive grid */}
                        <div className="grid grid-cols-3 gap-6 items-start">
                            {/* Left Column - Bio + Interests */}
                            <div className="col-span-2 space-y-6">
                                <div className="desktop-card">
                                    <h3 className="text-xl font-bold text-text-primary mb-4">About Me</h3>
                                    {userProfile.bio ? (
                                        <p className="text-text-primary leading-relaxed text-base">
                                            {userProfile.bio}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-pen text-accent-primary text-sm"></i>
                                            </div>
                                            <p className="text-text-secondary text-sm">Tell others about yourself — your background, passions, and what you're building.</p>
                                            <button 
                                                className="btn-primary py-2 px-5 rounded-xl text-sm flex-shrink-0"
                                                onClick={() => navigate('/profile/edit')}
                                            >
                                                Add Bio
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Interests — moved here for better visual balance */}
                                <div className="desktop-card">
                                    <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                                        <i className="fas fa-heart text-accent-primary text-base"></i>
                                        Interests
                                    </h3>
                                    {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map((interest, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg text-sm font-medium border border-accent-primary/30"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-heart text-accent-primary text-sm"></i>
                                            </div>
                                            <p className="text-text-secondary text-sm">Add your interests to connect with like-minded people.</p>
                                            <button 
                                                className="btn-primary py-2 px-5 rounded-xl text-sm flex-shrink-0"
                                                onClick={() => navigate('/profile/edit')}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Certifications — moved here */}
                                <div className="desktop-card">
                                    <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                                        <i className="fas fa-certificate text-accent-primary text-base"></i>
                                        Certifications
                                    </h3>
                                    {profile?.certifications && profile.certifications.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.certifications.map((cert, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-bg-secondary/80 border border-glass-border rounded-lg text-sm text-text-primary font-medium">
                                                    {cert}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-certificate text-accent-primary text-sm"></i>
                                            </div>
                                            <p className="text-text-secondary text-sm">Show off your certifications and qualifications.</p>
                                            <button 
                                                className="btn-primary py-2 px-5 rounded-xl text-sm flex-shrink-0"
                                                onClick={() => navigate('/profile/edit')}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Skills & Social */}
                            <div className="space-y-6">
                                <div className="desktop-card">
                                    <h3 className="text-lg font-bold text-text-primary mb-3">Technical Skills</h3>
                                    {profile?.skills && profile.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-sm text-text-primary font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 py-2">
                                            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-code text-accent-primary text-sm"></i>
                                            </div>
                                            <p className="text-text-secondary text-sm flex-1">No skills added yet</p>
                                            <button 
                                                className="btn-primary py-1.5 px-4 rounded-lg text-xs flex-shrink-0"
                                                onClick={() => navigate('/profile/edit')}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="desktop-card">
                                    <h3 className="text-lg font-bold text-text-primary mb-3">Connect</h3>
                                    {(profile?.github_url || profile?.linkedin_url || profile?.website || profile?.instagram_url) ? (
                                        <div className="space-y-2">
                                            {profile?.github_url && (
                                                <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2.5 hover:border-accent-primary/30 transition-all group" href={profile.github_url} target="_blank" rel="noreferrer">
                                                    <i className="fab fa-github text-lg text-text-primary group-hover:text-accent-primary transition-colors"></i>
                                                    <span className="font-medium text-sm text-text-primary">GitHub</span>
                                                </a>
                                            )}
                                            {profile?.linkedin_url && (
                                                <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2.5 hover:border-blue-500/30 transition-all group" href={profile.linkedin_url} target="_blank" rel="noreferrer">
                                                    <i className="fab fa-linkedin text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
                                                    <span className="font-medium text-sm text-text-primary">LinkedIn</span>
                                                </a>
                                            )}
                                            {profile?.instagram_url && (
                                                <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2.5 hover:border-pink-500/30 transition-all group" href={profile.instagram_url} target="_blank" rel="noreferrer">
                                                    <i className="fab fa-instagram text-lg text-pink-400 group-hover:scale-110 transition-transform"></i>
                                                    <span className="font-medium text-sm text-text-primary">Instagram</span>
                                                </a>
                                            )}
                                            {profile?.website && (
                                                <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2.5 hover:border-accent-primary/30 transition-all group" href={profile.website} target="_blank" rel="noreferrer">
                                                    <i className="fas fa-globe text-lg text-accent-primary group-hover:scale-110 transition-transform"></i>
                                                    <span className="font-medium text-sm text-text-primary">Website</span>
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 py-2">
                                            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-link text-accent-primary text-sm"></i>
                                            </div>
                                            <p className="text-text-secondary text-sm flex-1">No links added</p>
                                            <button 
                                                className="btn-primary py-1.5 px-4 rounded-lg text-xs flex-shrink-0"
                                                onClick={() => navigate('/profile/edit')}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && userRole === 'founder' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                <i className="fas fa-rocket text-accent-primary"></i>
                                My Startups
                            </h2>
                            <button
                                className="btn-primary py-2.5 px-5 rounded-xl text-sm"
                                onClick={() => navigate('/add')}
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Create New
                            </button>
                        </div>

                        {loadingComplete ? (
                            <div className="text-center py-16 desktop-card">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
                                <p className="text-text-secondary">Loading your portfolio...</p>
                            </div>
                        ) : !completeProfile?.startups?.length ? (
                            <div className="text-center flex flex-col items-center py-16 desktop-card">
                                <div className="w-20 h-20 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-rocket text-3xl text-accent-primary"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">No Startups Yet</h3>
                                <p className="text-text-secondary mb-6 max-w-md mx-auto">Start your entrepreneurial journey by creating your first startup profile.</p>
                                <button
                                    className="btn-primary py-3 px-8 rounded-xl"
                                    onClick={() => navigate('/add')}
                                >
                                    Launch First Startup
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-5">
                                {completeProfile.startups.map((startup) => (
                                    <div key={startup.id} className="desktop-card group !p-0 overflow-hidden">
                                        <div className={`h-24 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                                            {startup.image && (
                                                <img src={startup.image} alt={startup.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                                                {startup.stage && (
                                                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold text-white border border-white/20">
                                                        {startup.stage}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-2.5 left-3">
                                                <h4 className="text-base font-bold text-white drop-shadow-md truncate">{startup.name}</h4>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {startup.category && (
                                                    <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                        {startup.category}
                                                    </span>
                                                )}
                                                {startup.funding && (
                                                    <span className="px-2 py-0.5 bg-bg-secondary/80 text-text-secondary rounded-md text-[10px] font-semibold">
                                                        {startup.funding}
                                                    </span>
                                                )}
                                            </div>
                                            {startup.description && (
                                                <p className="text-text-secondary mb-3 text-xs leading-relaxed line-clamp-2">{startup.description}</p>
                                            )}
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="btn-primary flex-1 py-2 rounded-xl text-xs font-semibold"
                                                    onClick={() => {
                                                        const ownerUsername = startup.profiles?.username || profile?.username
                                                        if (ownerUsername && startup.slug) {
                                                            navigate(`/${ownerUsername}/startup/${startup.slug}`)
                                                        } else {
                                                            navigate(`/startup/${startup.id}`)
                                                        }
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="w-9 h-9 flex items-center justify-center bg-bg-secondary border border-glass-border rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-border transition-colors"
                                                    onClick={() => navigate('/profile/edit')}
                                                >
                                                    <i className="fas fa-edit text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'portfolio' && userRole === 'investor' && (
                    <div className="text-center py-16 desktop-card animate-fade-in">
                        <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-chart-line text-3xl text-green-400"></i>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Investment Dashboard</h3>
                        <p className="text-text-secondary max-w-md mx-auto">Track and manage your startup investments from this central hub.</p>
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <i className="fas fa-trophy text-yellow-500"></i>
                            Achievements & Badges
                        </h2>

                        {loadingComplete ? (
                            <div className="text-center py-16 desktop-card">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                                <p className="text-text-secondary">Loading achievements...</p>
                            </div>
                        ) : !completeProfile?.achievements?.length ? (
                            <div className="text-center flex flex-col items-center py-16 desktop-card">
                                <div className="w-20 h-20 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-trophy text-3xl text-yellow-500"></i>
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">No Achievements Yet</h3>
                                <p className="text-text-secondary mb-6 max-w-md mx-auto">Complete your profile and interact with the platform to unlock special badges.</p>
                                <button
                                    className="btn-primary py-3 px-8 rounded-xl"
                                    onClick={() => navigate('/profile/edit')}
                                >
                                    Complete Profile
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {completeProfile.achievements.map((achievement, index) => (
                                    <div key={index} className="desktop-card flex flex-col items-center text-center p-6">
                                        <div className="state-icon state-icon-sm state-icon-yellow" style={{marginBottom: '16px'}}>
                                            <i className="fas fa-trophy"></i>
                                        </div>
                                        <h4 className="text-lg font-bold text-text-primary mb-2">{achievement.title}</h4>
                                        <p className="text-sm text-text-secondary mb-3 leading-relaxed">{achievement.description}</p>
                                        <div className="text-yellow-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                            <i className="fas fa-calendar-alt text-[10px]"></i>
                                            {new Date(achievement.date_earned).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesktopProfilePage

