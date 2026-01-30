import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { profileService } from '../services'
import LocationSelector from '../components/LocationSelector'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [userData, setUserData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    locationContinent: '',
    locationCountry: '',
    locationCity: '',
    website: '',
    role: '',
    interests: []
  })

  // Check if user is authenticated and load existing profile
  useEffect(() => {
    if (!user?.id) {
      navigate('/login')
      return
    }

    // Load existing profile data if available
    const loadExistingProfile = async () => {
      try {
        const existingProfile = await profileService.getProfile(user.id)

        if (existingProfile) {
          // If user has already completed onboarding, redirect to home
          if (existingProfile.onboarding_completed) {
            navigate('/home', { replace: true })
            return
          }

          setUserData(prev => ({
            ...prev,
            full_name: existingProfile.full_name || '',
            username: existingProfile.username || '',
            bio: existingProfile.bio || '',
            location: existingProfile.location || '',
            website: existingProfile.website || '',
            role: existingProfile.role || '',
            interests: existingProfile.interests || []
          }))
        } else {
          console.log('No existing profile found, starting fresh')
        }
      } catch (error) {
        console.warn('Could not load existing profile:', error)
      }
    }

    loadExistingProfile()
  }, [user?.id, navigate])

  const interestCategories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const roles = [
    { value: 'founder', label: 'Founder', description: 'I want to create and grow startups', icon: 'fas fa-rocket' },
    { value: 'investor', label: 'Investor', description: 'I want to invest in promising startups', icon: 'fas fa-chart-line' }
  ]

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleInterestToggle = (interest) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const nextStep = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!userData.full_name.trim() || !userData.username.trim()) {
        setError('Please enter your full name and username')
        return
      }

      if (userData.username.trim().length < 3) {
        setError('Username must be at least 3 characters long')
        return
      }

      // Check username uniqueness
      try {
        setLoading(true)
        const isAvailable = await profileService.isUsernameAvailable(userData.username, user?.id)
        if (!isAvailable) {
          setError('This username is already taken or invalid. Please choose another one.')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Error checking username:', err)
      } finally {
        setLoading(false)
      }
    } else if (currentStep === 2) {
      if (!userData.role) {
        setError('Please select your role')
        return
      }
    } else if (currentStep === 3) {
      if (userData.interests.length === 0) {
        setError('Please select at least one interest category')
        return
      }
      if (!userData.locationContinent) {
        setError('Please select your continent')
        return
      }
    }

    setError(null)
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Prepare profile data for Supabase
      const profileData = {
        id: user.id,
        full_name: userData.full_name,
        username: userData.username || null,
        bio: userData.bio || null,
        location: userData.locationContinent === 'Remote'
          ? 'Remote'
          : `${userData.locationCity}, ${userData.locationCountry}, ${userData.locationContinent}`,
        website: userData.website || null,
        role: userData.role || null,
        interests: userData.interests && userData.interests.length > 0 ? userData.interests : null,
        onboarding_completed: true
      }

      console.log('Profile data to upsert:', profileData)

      // Use upsertProfile instead of updateProfile to create if doesn't exist
      const result = await profileService.upsertProfile(profileData)

      if (!result) {
        throw new Error('Failed to create/update profile')
      }

      // Navigate to home page
      navigate('/home')

    } catch (err) {
      console.error('Error completing onboarding:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      setError(`Failed to complete onboarding: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress percentage
  const progress = (currentStep / 4) * 100

  return (
    <div className="screen active onboarding-page">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-glass-border z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-300 to-blue-700 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="w-10"></div>
        <h1 className="text-lg font-bold">Welcome to Swipy</h1>
        <div className="w-10"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
          <div className="flex items-center gap-3 text-red-600">
            <i className="fas fa-exclamation-circle"></i>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6 min-h-0">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-user text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Tell us about yourself</h2>
              <p className="text-text-secondary">Let's start with the basics</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="Username (e.g., @yourname)"
                  value={userData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Bio
                </label>
                <textarea
                  value={userData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={userData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                  placeholder="https://yourwebsite.com (optional)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">What's your role?</h2>
              <p className="text-text-secondary">Choose the role that best describes you</p>
            </div>

            <div className="space-y-4">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleInputChange('role', role.value)}
                  className={`w-full p-6 text-left border-2 rounded-2xl ${userData.role === role.value
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-glass-border bg-glass-bg'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center">
                      <i className={`${role.icon} text-white text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">{role.label}</h3>
                      <p className="text-text-secondary text-sm">{role.description}</p>
                    </div>
                    {userData.role === role.value && (
                      <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                        <i className="fas fa-check text-white text-sm"></i>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Interests & Location */}
        {currentStep === 3 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">What interests you?</h2>
              <p className="text-text-secondary">Select industries and set your location</p>
            </div>

            <div className="space-y-6">
              {/* Interests */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Industry Interests</h3>
                <div className="grid grid-cols-2 gap-3">
                  {interestCategories.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-2xl border ${userData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                        : 'bg-glass-bg border-glass-border text-text-primary'
                        }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Location</h3>
                <LocationSelector
                  value={userData.location}
                  onChange={(value) => handleInputChange('location', value)}
                  onContinentChange={(value) => handleInputChange('locationContinent', value)}
                  onCountryChange={(value) => handleInputChange('locationCountry', value)}
                  onCityChange={(value) => handleInputChange('locationCity', value)}
                  continentValue={userData.locationContinent}
                  countryValue={userData.locationCountry}
                  cityValue={userData.locationCity}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Complete */}
        {currentStep === 4 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Review Your Profile</h2>
              <p className="text-text-secondary">Everything looks great! Let's get you started</p>
            </div>

            <div className="bg-glass-bg border border-glass-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{userData.full_name}</h3>
                  <p className="text-text-secondary">@{userData.username}</p>
                </div>
              </div>

              {userData.bio && (
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Bio</h4>
                  <p className="text-text-secondary text-sm">{userData.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Role</h4>
                  <p className="text-text-secondary text-sm capitalize">{userData.role}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Location</h4>
                  <p className="text-text-secondary text-sm">
                    {userData.locationContinent === 'Remote'
                      ? 'Remote'
                      : `${userData.locationCity}, ${userData.locationCountry}, ${userData.locationContinent}`}
                  </p>
                </div>
              </div>

              {userData.interests.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.interests.map((interest) => (
                      <span key={interest} className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-glass-border bg-bg-secondary/80">
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-2xl font-medium ${currentStep === 1
              ? 'bg-glass-bg text-text-secondary cursor-not-allowed'
              : 'bg-glass-bg text-text-primary'
              }`}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!userData.full_name.trim() || !userData.username.trim())) ||
                (currentStep === 2 && !userData.role) ||
                (currentStep === 3 && (userData.interests.length === 0 || !userData.locationContinent))
              }
              className="px-8 py-3 bg-gradient-to-r from-blue-300 to-blue-700 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-check'} mr-2`}></i>
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
