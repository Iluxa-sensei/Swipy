import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ProfilePage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [isOnline, setIsOnline] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  // Симуляция загрузки профиля
  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const loadedProfile = localStorage.getItem('profile_data')
    ? JSON.parse(localStorage.getItem('profile_data'))
    : null

  const hasProfile = loadedProfile && loadedProfile.name

  const userProfile = hasProfile ? {
    name: loadedProfile.name,
    username: loadedProfile.username || 'user',
    title: loadedProfile.title,
    avatar: loadedProfile.name?.charAt(0)?.toUpperCase() + (loadedProfile.name?.split(' ')[1]?.charAt(0)?.toUpperCase() || ''),
    location: loadedProfile.location,
    experience: loadedProfile.experience,
    skills: loadedProfile.skills || [],
    bio: loadedProfile.bio,
    socials: loadedProfile.socials || {},
    avatarUrl: loadedProfile.avatar || null,
    portfolio: loadedProfile.portfolio || [],
    certifications: loadedProfile.certifications || [],
    achievements: [
      { title: "Profile Pro", description: "Complete profile setup", icon: "fas fa-trophy", unlocked: true },
      { title: "First Match", description: "Matched with your first startup", icon: "fas fa-heart", unlocked: false },
      { title: "Active User", description: "7 days in a row", icon: "fas fa-fire", unlocked: false },
      { title: "Portfolio Master", description: "Added 5+ portfolio projects", icon: "fas fa-briefcase", unlocked: false },
      { title: "Social Star", description: "100+ profile views", icon: "fas fa-star", unlocked: false }
    ],
    responseTime: loadedProfile.responseTime,
    hourlyRate: loadedProfile.hourlyRate,
    availability: loadedProfile.availability || "Available"
  } : null

  const stats = [
    { label: "Profile Views", value: "47", icon: "fas fa-eye" },
    { label: "Matches", value: "12", icon: "fas fa-heart" },
    { label: "Applications", value: "8", icon: "fas fa-paper-plane" },
    { label: "Days Active", value: "14", icon: "fas fa-calendar" }
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
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <i className="fas fa-user text-3xl text-white"></i>
            </div>
            <div className="text-text-secondary">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  // Если профиля нет, показываем экран создания
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
                <i className="fas fa-users text-accent-primary text-2xl mb-2"></i>
                <p className="text-text-secondary text-sm">Connect with Teams</p>
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
            {userProfile.title && <span><i className="fas fa-briefcase mr-1"></i>{userProfile.title}</span>}
            {userProfile.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{userProfile.location}</span>}
            {userProfile.experience && <span><i className="fas fa-clock mr-1"></i>{userProfile.experience} years</span>}
          </div>

          {/* Quick Stats */}
          {(userProfile.hourlyRate || userProfile.availability) && (
            <div className="flex items-center justify-center gap-4 mb-4">
              {userProfile.hourlyRate && (
                <>
                  <div className="text-center">
                    <div className="text-text-primary font-bold text-lg">{userProfile.hourlyRate}</div>
                    <div className="text-text-secondary text-xs">Hourly Rate</div>
                  </div>
                  <div className="w-px h-8 bg-glass-border"></div>
                </>
              )}
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{userProfile.availability}</div>
                <div className="text-text-secondary text-xs">Status</div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {(userProfile.socials.github || userProfile.socials.linkedin || userProfile.socials.instagram || userProfile.socials.website) && (
            <div className="flex items-center justify-center gap-3">
              {userProfile.socials.github && (
                <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-gray-600 hover:text-white transition-all duration-200 hover:scale-110" href={userProfile.socials.github} target="_blank" rel="noreferrer">
                  <i className="fab fa-github text-lg"></i>
                </a>
              )}
              {userProfile.socials.linkedin && (
                <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-blue-600 hover:text-white transition-all duration-200 hover:scale-110" href={userProfile.socials.linkedin} target="_blank" rel="noreferrer">
                  <i className="fab fa-linkedin text-lg"></i>
                </a>
              )}
              {userProfile.socials.instagram && (
                <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-pink-600 hover:text-white transition-all duration-200 hover:scale-110" href={userProfile.socials.instagram} target="_blank" rel="noreferrer">
                  <i className="fab fa-instagram text-lg"></i>
                </a>
              )}
              {userProfile.socials.website && (
                <a className="w-12 h-12 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center text-text-primary hover:bg-accent-primary hover:text-white transition-all duration-200 hover:scale-110" href={userProfile.socials.website} target="_blank" rel="noreferrer">
                  <i className="fas fa-globe text-lg"></i>
                </a>
              )}
            </div>
          )}
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
            {/* Enhanced Stats */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <i className="fas fa-chart-line text-accent-primary"></i>
                Activity Dashboard
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gradient-to-br from-bg-secondary/50 to-bg-secondary/30 border border-glass-border rounded-2xl p-5 text-center hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-accent-primary/20">
                    <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <i className={`${stat.icon} text-white text-xl`}></i>
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-text-secondary font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="p-6 border-t border-glass-border">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <i className="fas fa-code text-accent-primary"></i>
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {userProfile.skills.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-bg-secondary/80 border border-glass-border rounded-full text-sm text-text-primary hover:bg-bg-secondary transition-colors duration-200 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Enhanced Bio */}
            <div className="p-6 border-t border-glass-border">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <i className="fas fa-info-circle text-accent-primary"></i>
                About Me
              </h3>
              <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
                <p className="text-text-primary leading-relaxed text-lg">{userProfile.bio}</p>
              </div>
            </div>

            {/* Certifications */}
            <div className="p-6 border-t border-glass-border">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <i className="fas fa-certificate text-accent-primary"></i>
                Certifications
              </h3>
              <div className="space-y-3">
                {userProfile.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-bg-secondary/80 border border-glass-border rounded-xl hover:scale-[1.02] transition-all duration-200">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cert.verified ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      <i className={`fas ${cert.verified ? 'fa-check-circle' : 'fa-clock'}`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-text-primary font-semibold">{cert.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span>{cert.issuer}</span>
                        <span>•</span>
                        <span>{cert.year}</span>
                        {cert.verified && (
                          <>
                            <span>•</span>
                            <span className="text-green-400 font-medium">Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-rocket text-accent-primary"></i>
              My Startups
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {userProfile.portfolio.map((startup) => (
                <div key={startup.id} className="bg-bg-secondary/80 border border-glass-border rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-accent-primary/20">
                  <div className={`h-32 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                    {startup.image && (
                      <img src={startup.image} alt={startup.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {startup.funding && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                          {startup.funding}
                        </span>
                      )}
                      {startup.stage && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                          {startup.stage}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-text-primary mb-2">{startup.name}</h4>
                    <p className="text-text-secondary mb-3 leading-relaxed">{startup.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-medium">
                        {startup.category}
                      </span>
                      {startup.teamSize && (
                        <span className="px-3 py-1 bg-bg-secondary/80 text-text-secondary rounded-full text-sm font-medium">
                          Team: {startup.teamSize}
                        </span>
                      )}
                      {startup.location && (
                        <span className="px-3 py-1 bg-bg-secondary/80 text-text-secondary rounded-full text-sm font-medium">
                          📍 {startup.location}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary flex-1 hover:bg-accent-primary hover:text-white transition-all duration-200"
                        onClick={() => navigate(`/startup/${startup.id}`)}
                      >
                        <i className="fas fa-eye"></i>
                        View Details
                      </button>
                      <button
                        className="btn-secondary hover:bg-accent-primary hover:text-white transition-all duration-200"
                        onClick={() => navigate('/profile/edit')}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-trophy text-accent-primary"></i>
              Achievements & Badges
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {userProfile.achievements.map((achievement, index) => (
                <div key={index} className={`flex items-center gap-4 p-5 border rounded-2xl transition-all duration-300 hover:scale-[1.02] ${achievement.unlocked
                  ? 'bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border-accent-primary/30 shadow-lg shadow-accent-primary/10'
                  : 'bg-glass-bg border-glass-border opacity-60'
                  }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${achievement.unlocked
                    ? 'bg-gradient-primary shadow-lg'
                    : 'bg-gray-600'
                    }`}>
                    <i className={`${achievement.icon} text-white text-2xl ${achievement.unlocked ? 'animate-pulse' : ''}`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text-primary font-bold text-lg mb-1">{achievement.title}</h4>
                    <p className="text-text-secondary">{achievement.description}</p>
                    {achievement.unlocked && (
                      <div className="text-accent-primary text-sm font-semibold mt-2 flex items-center gap-1">
                        <i className="fas fa-check-circle"></i>
                        Unlocked
                      </div>
                    )}
                  </div>
                  {!achievement.unlocked && (
                    <div className="text-gray-500">
                      <i className="fas fa-lock text-2xl"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="p-6 border-t border-glass-border">
          <div className="grid grid-cols-1 gap-3">
            <button
              className="btn-primary hover:scale-105 transition-all duration-200 text-lg py-4"
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
                    url: window.location.origin
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
