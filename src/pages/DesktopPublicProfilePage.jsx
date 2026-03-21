import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { profileService, chatService } from '../services'
import { supabase } from '../services/supabaseClient'
import { normalizeExternalUrl } from '../utils/security.js'

const DesktopPublicProfilePage = () => {
  const { id, nickname } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingStartups, setLoadingStartups] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showToast, setShowToast] = useState(false)

  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    const loadProfile = async () => {
      // Check if nickname is "undefined" string or actually undefined
      const validNickname = nickname && nickname !== 'undefined' ? nickname : null
      const validId = id && id !== 'undefined' ? id : null

      if (!validId && !validNickname) {
        setError('Invalid profile reference')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch profile data
        let profileData
        if (validNickname) {
          profileData = await profileService.getProfileByUsername(validNickname)
        } else if (validId) {
          profileData = await profileService.getProfile(validId)
        }
        
        if (!profileData) {
          setError('Profile not found')
          setLoading(false)
          return
        }

        setProfile(profileData)

        // If user is a founder, load their startups
        if (profileData.role === 'founder') {
          setLoadingStartups(true)
          try {
            const { data: startupsData, error: startupsError } = await supabase
              .from('startups')
              .select('id,name,slug,logo_url,gradient,description,industry,location,funding_round,stage,owner_id')
              .eq('owner_id', profileData.id)
              .order('created_at', { ascending: false })

            if (startupsError) throw startupsError
            
            // Fetch owner usernames separately
            if (startupsData && startupsData.length > 0) {
              const ownerIds = [...new Set(startupsData.map(s => s.owner_id).filter(Boolean))]
              if (ownerIds.length > 0) {
                const { data: ownerProfiles } = await supabase
                  .from('profiles')
                  .select('id,username')
                  .in('id', ownerIds)
                
                const ownerMap = {}
                if (ownerProfiles) {
                  ownerProfiles.forEach(p => { ownerMap[p.id] = p.username })
                }
                
                startupsData.forEach(startup => {
                  startup.profiles = ownerMap[startup.owner_id] ? { username: ownerMap[startup.owner_id] } : null
                })
              }
            }
            
            setStartups(startupsData || [])
          } catch (err) {
            console.error('Error loading startups:', err)
          } finally {
            setLoadingStartups(false)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [id, nickname])

  // Redirect to own profile page if viewing own profile
  useEffect(() => {
    if (isOwnProfile && !loading) {
      navigate('/profile', { replace: true })
    }
  }, [isOwnProfile, loading, navigate])

  if (loading) {
    return (
      <div className="desktop-page">
        <div className="desktop-page-section">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="state-icon state-icon-sm state-icon-blue animate-pulse">
                <i className="fas fa-user"></i>
              </div>
              <div className="text-text-secondary">Loading profile...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="desktop-page">
        <div className="desktop-page-section">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="state-icon state-icon-red">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">{error}</h2>
              <p className="text-text-secondary mb-6">The profile you're looking for doesn't exist or has been removed.</p>
              <button className="btn-primary" onClick={() => navigate('/home')}>
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const userProfile = {
    name: profile.full_name || 'User',
    username: profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '_') || 'user',
    title: profile.role || 'Member',
    avatar: profile.full_name?.charAt(0)?.toUpperCase() + (profile.full_name?.split(' ')[1]?.charAt(0)?.toUpperCase() || ''),
    location: profile.location,
    bio: profile.bio,
    avatarUrl: profile.avatar_url || null,
    interests: profile.interests || [],
    role: profile.role,
    skills: profile.skills || [],
    certifications: profile.certifications || [],
    github_url: profile.github_url,
    linkedin_url: profile.linkedin_url,
    website: profile.website,
    instagram_url: profile.instagram_url
  }

  const userRole = profile.role || 'founder'

  return (
    <div className="desktop-page">
      {/* Profile Header */}
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
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!isOwnProfile && (
              <button
                className="btn-primary py-2.5 px-6 rounded-xl text-sm"
                onClick={async () => {
                  if (!user?.id) {
                    navigate('/login')
                    return
                  }
                  try {
                    const chatId = await chatService.getOrCreateUserChat(user.id, profile.id)
                    if (chatId) {
                      navigate(`/chat-detail/${userProfile.username}`)
                    }
                  } catch (err) {
                    console.error('Error starting chat:', err)
                    alert('Failed to start conversation. Please try again.')
                  }
                }}
              >
                <i className="fas fa-comment mr-2"></i>
                Message
              </button>
            )}
            <button
              className="btn-secondary py-2.5 px-6 rounded-xl text-sm"
              onClick={async () => {
                const profileUrl = window.location.origin + `/profile/${profile?.username || profile?.id}`
                try {
                  await navigator.clipboard.writeText(profileUrl)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 3000)
                } catch (e) {
                  console.error('Failed to copy to clipboard:', e)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 3000)
                }
              }}
            >
              <i className="fas fa-share mr-2"></i>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      {userRole === 'founder' && (
        <div className="desktop-page-section !py-0 !px-0 border-b border-glass-border bg-bg-primary/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex max-w-3xl mx-auto">
            {['profile', 'portfolio'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-4 px-6 text-center transition-all duration-200 relative ${
                  activeTab === tab
                    ? 'text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className={`${tab === 'profile' ? 'fas fa-user' : 'fas fa-briefcase'} text-base`}></i>
                  <span className="font-semibold">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </div>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Bio */}
              <div className="col-span-2 space-y-6">
                <div className="desktop-card">
                  <h3 className="text-xl font-bold text-text-primary mb-4">About Me</h3>
                  {userProfile.bio ? (
                    <p className="text-text-primary leading-relaxed text-base">{userProfile.bio}</p>
                  ) : (
                    <p className="text-text-secondary">No bio added yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column - Skills & Social */}
              <div className="space-y-6">
                {userProfile.skills && userProfile.skills.length > 0 && (
                  <div className="desktop-card">
                    <h3 className="text-xl font-bold text-text-primary mb-4">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-sm text-text-primary font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(userProfile.github_url || userProfile.linkedin_url || userProfile.website || userProfile.instagram_url) && (
                  <div className="desktop-card">
                    <h3 className="text-xl font-bold text-text-primary mb-4">Connect</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {userProfile.github_url && (
                        <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2 hover:border-accent-primary/30 transition-all group" href={normalizeExternalUrl(userProfile.github_url) || '#'} target="_blank" rel="noreferrer">
                          <i className="fab fa-github text-lg text-text-primary group-hover:text-accent-primary transition-colors"></i>
                          <span className="font-medium text-sm text-text-primary">GitHub</span>
                        </a>
                      )}
                      {userProfile.linkedin_url && (
                        <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2 hover:border-blue-500/30 transition-all group" href={normalizeExternalUrl(userProfile.linkedin_url) || '#'} target="_blank" rel="noreferrer">
                          <i className="fab fa-linkedin text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
                          <span className="font-medium text-sm text-text-primary">LinkedIn</span>
                        </a>
                      )}
                      {userProfile.instagram_url && (
                        <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2 hover:border-pink-500/30 transition-all group" href={normalizeExternalUrl(userProfile.instagram_url) || '#'} target="_blank" rel="noreferrer">
                          <i className="fab fa-instagram text-lg text-pink-400 group-hover:scale-110 transition-transform"></i>
                          <span className="font-medium text-sm text-text-primary">Instagram</span>
                        </a>
                      )}
                      {userProfile.website && (
                        <a className="p-3 bg-bg-secondary/40 border border-glass-border rounded-lg flex items-center gap-2 hover:border-accent-primary/30 transition-all group" href={normalizeExternalUrl(userProfile.website) || '#'} target="_blank" rel="noreferrer">
                          <i className="fas fa-globe text-lg text-accent-primary group-hover:scale-110 transition-transform"></i>
                          <span className="font-medium text-sm text-text-primary">Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-2 gap-6">
              {/* Interests */}
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className="desktop-card">
                  <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <i className="fas fa-heart text-accent-primary"></i>
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg text-sm font-medium border border-accent-primary/30"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {userProfile.certifications && userProfile.certifications.length > 0 && (
                <div className="desktop-card">
                  <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <i className="fas fa-certificate text-accent-primary"></i>
                    Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.certifications.map((cert, index) => (
                      <span key={index} className="px-3 py-1.5 bg-bg-secondary/80 border border-glass-border rounded-lg text-sm text-text-primary font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && userRole === 'founder' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <i className="fas fa-rocket text-accent-primary"></i>
              Startups
            </h2>

            {loadingStartups ? (
              <div className="text-center py-16 desktop-card">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading startups...</p>
              </div>
            ) : startups.length === 0 ? (
              <div className="text-center py-16 desktop-card">
                <div className="w-20 h-20 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-rocket text-3xl text-accent-primary"></i>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Startups Yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">This user hasn't created any startups yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {startups.map((startup) => (
                  <div
                    key={startup.id}
                    className="desktop-card group !p-0 overflow-hidden cursor-pointer"
                    onClick={() => {
                      const ownerNickname = startup.profiles?.username || profile.username
                      if (ownerNickname && startup.slug) {
                        navigate(`/${ownerNickname}/startup/${startup.slug}`)
                      } else {
                        navigate(`/startup/${startup.id}`)
                      }
                    }}
                  >
                    <div className={`h-40 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">
                            {startup.name ? startup.name.substring(0, 2).toUpperCase() : 'ST'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        {startup.funding_round && (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/30">
                            {startup.funding_round}
                          </span>
                        )}
                        {startup.stage && (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/30">
                            {startup.stage}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-bold text-text-primary mb-2">{startup.name}</h4>
                      {startup.description && (
                        <p className="text-text-secondary mb-4 leading-relaxed text-sm line-clamp-2">{startup.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        {startup.industry && (
                          <span>
                            <i className="fas fa-industry mr-1"></i>
                            {startup.industry}
                          </span>
                        )}
                        {startup.location && (
                          <span>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {startup.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-bg-secondary/95 backdrop-blur-md border border-glass-border rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[400px] transform transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fas fa-check text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold text-sm">Link copied!</p>
              <p className="text-text-secondary text-xs mt-0.5">Profile link copied to clipboard</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopPublicProfilePage
