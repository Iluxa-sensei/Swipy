import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { profileServiceEnhanced } from '../services/profileServiceEnhanced'
import Loader from '../components/Loader.jsx'
import { normalizeExternalUrl } from '../utils/security.js'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)
  const [activeTab, setActiveTab] = useState('profile')
  const [isOnline, setIsOnline] = useState(true)
  const [completeProfile, setCompleteProfile] = useState(null)
  const [loadingComplete, setLoadingComplete] = useState(false)

  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Load complete profile data
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
    experience: profile.experience || '0 years',
    skills: profile.skills || [],
    bio: profile.bio,
    socials: profile.socials || {},
    avatarUrl: profile.avatar_url || null,
    portfolio: profile.portfolio || [],
    certifications: profile.certifications || [],
    achievements: [],
    responseTime: profile.response_time || '24h',
    hourlyRate: profile.hourly_rate || '0',
    availability: profile.availability || "Available"
  } : null

  const stats = [
    { label: "Profile Views", value: profile?.profile_views || "0", icon: "fas fa-eye" },
    { label: "Matches", value: profile?.matches || "0", icon: "fas fa-heart" },
    { label: "Applications", value: profile?.applications || "0", icon: "fas fa-paper-plane" },
    { label: "Days Active", value: profile?.days_active || "0", icon: "fas fa-calendar" }
  ]

  if (profileLoading) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn"><i className="fas fa-bell"></i></button>
          <h1>Profile</h1>
          <button className="header-btn"><i className="fas fa-cog"></i></button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader />
            <div className="text-text-secondary mt-4">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (profileError) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/home')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Profile</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="state-icon state-icon-red">
              <i className="fas fa-exclamation-triangle"></i>
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Error Loading Profile
            </h2>

            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              {profileError}
            </p>

            <button
              className="btn-primary w-full text-lg py-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-accent-primary/30"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-refresh mr-2"></i>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If no profile, show creation screen
  if (!profileLoading && !hasProfile) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/home')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Profile</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <i className="fas fa-user-plus text-5xl text-white"></i>
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Create Your Profile
            </h2>

            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              Build your professional profile to connect with amazing startups and showcase your skills to potential employers.
            </p>

            <div className="space-y-4">
              <button
                className="btn-primary w-full text-lg py-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-accent-primary/30"
                onClick={() => navigate('/profile/edit')}
              >
                <i className="fas fa-plus mr-3"></i>
                Create Profile
              </button>

              <button
                className="btn-secondary w-full text-lg py-4"
                onClick={() => navigate('/home')}
              >
                <i className="fas fa-home mr-3"></i>
                Back to Home
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                <i className="fas fa-briefcase text-accent-primary text-2xl mb-2"></i>
                <p className="text-text-secondary text-sm">Showcase Portfolio</p>
              </div>
              <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                <i className="fas fa-chart-line text-accent-primary text-2xl mb-2"></i>
                <p className="text-text-secondary text-sm">Raise Investments</p>
              </div>
              <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                <i className="fas fa-rocket text-accent-primary text-2xl mb-2"></i>
                <p className="text-text-secondary text-sm">Join Startups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={() => navigate('/notifications')}>
          <i className="fas fa-bell"></i>
        </button>
        <h1>Profile</h1>
        <button className="header-btn" onClick={() => navigate('/settings')}>
          <i className="fas fa-cog"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Enhanced Profile Header */}
        <div className="relative p-6 text-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border-b border-glass-border">
          {/* Online Status */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Avatar */}
          <div className="relative inline-block">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="avatar" className="w-28 h-28 rounded-3xl object-cover mx-auto mb-4 border-4 border-accent-primary/30" />
            ) : (
              <div className="w-28 h-28 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 hover:scale-105 transition-transform duration-300 border-4 border-accent-primary/30">
                {userProfile.avatar}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-text-primary mb-2">{userProfile.name}</h2>
          <p className="text-accent-primary text-lg font-semibold mb-3">@{userProfile.username}</p>

          {/* Professional Info */}
          <div className="flex items-center justify-center gap-6 text-sm text-text-secondary mb-4">
            {userProfile.job_title && <span><i className="fas fa-briefcase mr-1"></i>{userProfile.job_title}</span>}
            {userProfile.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{userProfile.location}</span>}
            {userProfile.experience_years > 0 && <span><i className="fas fa-clock mr-1"></i>{userProfile.experience_years} years</span>}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center bg-glass-bg border-b border-glass-border">
          <div className="flex max-w-md w-full">
            {['profile', 'portfolio', 'achievements'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-4 px-6 text-center transition-all duration-200 ${activeTab === tab
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                <i className={`${tab === 'profile' ? 'fas fa-user' :
                  tab === 'portfolio' ? 'fas fa-briefcase' :
                    'fas fa-trophy'
                  } mr-2`}></i>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-code text-blue-400"></i>
                  Technical Skills
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-bg-secondary/80 border border-glass-border rounded-full text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-200 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Bio */}
            {profile?.bio && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-400"></i>
                  About Me
                </h3>
                <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
                  <p className="text-text-primary leading-relaxed text-lg">{profile.bio}</p>
                </div>
              </div>
            )}

            {/* Social Links */}
            {(profile?.github_url || profile?.linkedin_url || profile?.website || profile?.instagram_url) && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-link text-blue-400"></i>
                  Links
                </h3>
                <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-3">
                    {profile?.github_url && (
                      <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-gray-600 hover:text-white transition-all duration-200 hover:scale-110" href={normalizeExternalUrl(profile.github_url) || '#'} target="_blank" rel="noreferrer">
                        <i className="fab fa-github text-lg"></i>
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-blue-600 hover:text-white transition-all duration-200 hover:scale-110" href={normalizeExternalUrl(profile.linkedin_url) || '#'} target="_blank" rel="noreferrer">
                        <i className="fab fa-linkedin text-lg"></i>
                      </a>
                    )}
                    {profile?.instagram_url && (
                      <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-pink-600 hover:text-white transition-all duration-200 hover:scale-110" href={normalizeExternalUrl(profile.instagram_url) || '#'} target="_blank" rel="noreferrer">
                        <i className="fab fa-instagram text-lg"></i>
                      </a>
                    )}
                    {profile?.website && (
                      <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-accent-primary hover:text-white transition-all duration-200 hover:scale-110" href={normalizeExternalUrl(profile.website) || '#'} target="_blank" rel="noreferrer">
                        <i className="fas fa-globe text-lg"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            {(userProfile.hourlyRate || userProfile.availability) && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-chart-bar text-blue-400"></i>
                  Statistics
                </h3>
                <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-4">
                    {userProfile.hourlyRate && (
                      <>
                        <div className="text-center">
                          <div className="text-text-primary font-bold text-lg">{userProfile.hourlyRate}</div>
                          <div className="text-text-secondary text-xs">Hourly Rate</div>
                        </div>
                        {userProfile.availability && <div className="w-px h-8 bg-glass-border"></div>}
                      </>
                    )}
                    {userProfile.availability && (
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-lg">{userProfile.availability}</div>
                        <div className="text-text-secondary text-xs">Status</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interests */}
            {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-heart text-blue-400"></i>
                  Interests
                </h3>
                <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
                  <div className="flex flex-wrap gap-3">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-medium border border-accent-primary/30"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile?.certifications && profile.certifications.length > 0 && (
              <div className="p-6 border-t border-glass-border">
                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                  <i className="fas fa-certificate text-blue-400"></i>
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profile.certifications.map((cert, index) => (
                    <span key={index} className="px-4 py-2 bg-bg-secondary/80 border border-glass-border rounded-full text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-200 font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && userRole === 'founder' && (
          <div className="p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <i className="fas fa-rocket text-accent-primary"></i>
                My Startups
              </h3>
              <button
                className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold"
                onClick={() => navigate('/add')}
              >
                <i className="fas fa-plus mr-1.5"></i>
                Create New
              </button>
            </div>
            {loadingComplete ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-primary mx-auto mb-3"></div>
                <p className="text-text-secondary text-sm">Loading startups...</p>
              </div>
            ) : completeProfile?.startups?.length === 0 ? (
              <div className="text-center flex flex-col items-center py-10">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-rocket text-2xl text-accent-primary"></i>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">No Startups Yet</h3>
                <p className="text-text-secondary text-sm mb-5">Create your first startup to showcase your entrepreneurial journey</p>
                <button
                  className="btn-primary py-2.5 px-6 rounded-xl text-sm"
                  onClick={() => navigate('/add')}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Launch First Startup
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completeProfile?.startups?.map((startup) => (
                  <div key={startup.id} className="bg-bg-secondary/80 border border-glass-border rounded-2xl overflow-hidden">
                    <div className={`h-20 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                      {startup.image && (
                        <img src={startup.image} alt={startup.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {startup.stage && (
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[10px] font-bold text-white">
                            {startup.stage}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-3">
                        <h4 className="text-base font-bold text-white drop-shadow-md">{startup.name}</h4>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {startup.category && (
                          <span className="px-2 py-0.5 bg-accent-primary/15 text-accent-primary rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {startup.category}
                          </span>
                        )}
                        {startup.funding && (
                          <span className="px-2 py-0.5 bg-bg-secondary/80 text-text-secondary rounded-md text-[10px] font-semibold">
                            {startup.funding}
                          </span>
                        )}
                        {startup.location && (
                          <span className="px-2 py-0.5 bg-bg-secondary/80 text-text-secondary rounded-md text-[10px] font-semibold">
                            📍 {startup.location}
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
          <div className="p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-chart-line text-green-400"></i>
              Investment Portfolio
            </h3>
            <div className="text-center py-12">
              <div className="state-icon state-icon-green">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Investment Dashboard</h3>
              <p className="text-text-secondary">Track your startup investments and performance here</p>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-trophy text-blue-400"></i>
              Achievements & Badges
            </h3>
            {loadingComplete ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading achievements...</p>
              </div>
            ) : completeProfile?.achievements?.length === 0 ? (
              <div className="text-center flex flex-col items-center py-12">
                <div className="state-icon state-icon-yellow">
                  <i className="fas fa-trophy"></i>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Achievements Yet</h3>
                <p className="text-text-secondary mb-6">Start building your profile to unlock achievements and badges</p>
                <button
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => navigate('/profile/edit')}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Complete Profile
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completeProfile?.achievements?.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 border border-glass-border rounded-2xl transition-all duration-300 hover:scale-[1.02] bg-bg-secondary/80">
                    <div className="state-icon state-icon-sm state-icon-yellow" style={{marginBottom: 0}}>
                      <i className="fas fa-trophy"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-text-primary font-bold text-lg mb-1">{achievement.title}</h4>
                      <p className="text-text-secondary">{achievement.description}</p>
                      <div className="text-yellow-400 text-sm font-semibold mt-2 flex items-center gap-1">
                        <i className="fas fa-calendar"></i>
                        {new Date(achievement.date_earned).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="p-6 border-t border-glass-border">
          <div className="grid grid-cols-1 gap-3">
            <button
              className="btn-icon-style text-lg py-4 font-semibold rounded-2xl"
              onClick={() => navigate('/profile/edit')}
            >
              <i className="fas fa-edit text-xl"></i>
              Edit Profile
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="btn-secondary hover:scale-105 transition-transform duration-200"
                onClick={() => navigate('/saved')}
              >
                <i className="fas fa-bookmark"></i>
                Saved
              </button>
              <button
                className="btn-secondary hover:scale-105 transition-transform duration-200"
                onClick={async () => {
                  const shareData = {
                    title: `${userProfile.name} — ${userProfile.title}`,
                    text: userProfile.bio,
                    url: window.location.origin + `/profile/${profile?.username || user?.id}`
                  }
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData)
                    } else {
                      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                      alert('Profile link copied to clipboard')
                    }
                  } catch (e) {
                    try {
                      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                      alert('Profile link copied to clipboard')
                    } catch { }
                  }
                }}
              >
                <i className="fas fa-share"></i>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
