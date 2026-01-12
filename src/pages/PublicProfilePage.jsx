import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { profileService } from '../services'
import { supabase } from '../services/supabaseClient'

const PublicProfilePage = () => {
  const { id, nickname } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingStartups, setLoadingStartups] = useState(false)

  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    const loadProfile = async () => {
      if (!id && !nickname) {
        setError('Invalid profile reference')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch profile data
        let profileData
        if (nickname) {
          profileData = await profileService.getProfileByUsername(nickname)
        } else {
          profileData = await profileService.getProfile(id)
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
              .select('*, profiles!startups_owner_id_fkey(username)')
              .eq('owner_id', profileData.id)
              .order('created_at', { ascending: false })

            if (startupsError) throw startupsError
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
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Profile</h1>
          <div className="w-10"></div>
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

  if (error) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Profile</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-32 h-32 bg-gradient-to-br from-red-300 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <i className="fas fa-exclamation-triangle text-5xl text-white"></i>
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              {error}
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <button
              className="btn-primary w-full text-lg py-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-accent-primary/30"
              onClick={() => navigate('/home')}
            >
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </button>
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
    role: profile.role
  }

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>{userProfile.name}</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Profile Header */}
        <div className="relative p-6 text-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border-b border-glass-border">
          {/* Avatar */}
          <div className="relative inline-block">
            {userProfile.avatarUrl ? (
              <img 
                src={userProfile.avatarUrl} 
                alt="avatar" 
                className="w-28 h-28 rounded-3xl object-cover mx-auto mb-4 border-4 border-accent-primary/30" 
              />
            ) : (
              <div className="w-28 h-28 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 border-4 border-accent-primary/30">
                {userProfile.avatar}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-text-primary mb-2">{userProfile.name}</h2>
          <p className="text-accent-primary text-lg font-semibold mb-3">@{userProfile.username}</p>

          {/* Message Button */}
          {!isOwnProfile && (
            <div className="mt-6 flex justify-center">
              <button
                className="btn-primary px-8 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-accent-primary/20"
                onClick={async () => {
                  if (!user?.id) {
                    navigate('/login');
                    return;
                  }
                  try {
                    const chatId = await chatService.getOrCreateUserChat(user.id, profile.id);
                    if (chatId) {
                      navigate(`/chat-detail/${userProfile.username}`);
                    }
                  } catch (err) {
                    console.error('Error starting chat:', err);
                    alert('Failed to start conversation. Please try again.');
                  }
                }}
              >
                <i className="fas fa-comment"></i>
                Message {userProfile.name.split(' ')[0]}
              </button>
          </div>
          )}
        </div>

        {/* Bio */}
        {userProfile.bio && (
          <div className="p-6 border-t border-glass-border">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-400"></i>
              About
            </h3>
            <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
              <p className="text-text-primary leading-relaxed text-lg">{userProfile.bio}</p>
            </div>
          </div>
        )}

        {/* Interests */}
        {userProfile.interests && Array.isArray(userProfile.interests) && userProfile.interests.length > 0 && (
          <div className="p-6 border-t border-glass-border">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-heart text-blue-400"></i>
              Interests
            </h3>
            <div className="bg-bg-secondary/80 border border-glass-border rounded-2xl p-6">
              <div className="flex flex-wrap gap-3">
                {userProfile.interests.map((interest, index) => (
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

        {/* Startups (if founder) */}
        {userProfile.role === 'founder' && (
          <div className="p-6 border-t border-glass-border">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <i className="fas fa-rocket text-blue-400"></i>
              Startups
            </h3>
            {loadingStartups ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading startups...</p>
              </div>
            ) : startups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-rocket text-3xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Startups Yet</h3>
                <p className="text-text-secondary">This user hasn't created any startups yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {startups.map((startup) => (
                  <div
                    key={startup.id}
                    className="bg-bg-secondary/80 border border-glass-border rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20 cursor-pointer"
                    onClick={() => {
                        const ownerNickname = startup.profiles?.username || profile.username
                        if (ownerNickname && startup.slug) {
                            navigate(`/${ownerNickname}/startup/${startup.slug}`)
                        } else {
                            navigate(`/startup/${startup.id}`)
                        }
                    }}
                  >
                    <div className={`h-32 ${startup.gradient || 'bg-gradient-primary'} relative`}>
                      {startup.logo_url ? (
                        <img
                          src={startup.logo_url}
                          alt={startup.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">
                            {startup.name ? startup.name.substring(0, 2).toUpperCase() : 'ST'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        {startup.funding_round && (
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                            {startup.funding_round}
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
                      {startup.description && (
                        <p className="text-text-secondary mb-3 leading-relaxed line-clamp-2">
                          {startup.description}
                        </p>
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
    </div>
  )
}

export default PublicProfilePage


