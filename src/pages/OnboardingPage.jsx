import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { profileService } from '../services'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [userData, setUserData] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    role: '',
    interests: [],
    experience_level: '',
    goals: []
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!user?.id) {
      navigate('/login')
      return
    }
  }, [user?.id, navigate])

  const interestCategories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const roles = [
    { value: 'founder', label: 'Founder', description: 'I want to create and grow startups', icon: '🚀' },
    { value: 'investor', label: 'Investor', description: 'I want to invest in promising startups', icon: '💰' },
    { value: 'developer', label: 'Developer', description: 'I want to join startup teams', icon: '👨‍💻' },
    { value: 'designer', label: 'Designer', description: 'I want to design for startups', icon: '🎨' }
  ]

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: '0-2 years experience' },
    { value: 'intermediate', label: 'Intermediate', description: '3-5 years experience' },
    { value: 'advanced', label: 'Advanced', description: '6+ years experience' }
  ]

  const goals = [
    { value: 'network', label: 'Network', description: 'Connect with other professionals' },
    { value: 'learn', label: 'Learn', description: 'Learn from successful founders' },
    { value: 'collaborate', label: 'Collaborate', description: 'Find collaboration opportunities' },
    { value: 'mentor', label: 'Mentor', description: 'Help others grow' }
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

  const handleGoalToggle = (goal) => {
    setUserData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!userData.full_name.trim()) {
        setError('Please enter your full name')
        return
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
      if (!userData.location.trim()) {
        setError('Please enter your location')
        return
      }
    } else if (currentStep === 4) {
      if (!userData.experience_level) {
        setError('Please select your experience level')
        return
      }
      if (userData.goals.length === 0) {
        setError('Please select at least one goal')
        return
      }
    }

    setError(null)
    if (currentStep < 5) {
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
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Prepare profile data for Supabase
      const profileData = {
        full_name: userData.full_name,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        role: userData.role,
        interests: userData.interests,
        experience_level: userData.experience_level,
        goals: userData.goals,
        onboarding_completed: true
      }

      // Update profile in Supabase
      await profileService.updateProfile(user.id, profileData)

      // Navigate to home page
      navigate('/home')

    } catch (err) {
      console.error('Error completing onboarding:', err)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const skipOnboarding = () => {
    navigate('/home')
  }

  // Calculate progress percentage
  const progress = (currentStep / 5) * 100

  return (
    <div className="screen active">
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
        <button
          className="header-btn text-sm"
          onClick={skipOnboarding}
        >
          Skip
        </button>
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
      <div className="flex-1 overflow-y-auto pb-6">
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
                  className={`w-full p-6 text-left border-2 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${userData.role === role.value
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-glass-border bg-glass-bg hover:border-accent-primary/50'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{role.icon}</div>
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
                      className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${userData.interests.includes(interest)
                          ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                          : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
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
                <input
                  type="text"
                  value={userData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                  placeholder="City, Country or Remote"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Experience & Goals */}
        {currentStep === 4 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Experience & Goals</h2>
              <p className="text-text-secondary">Help us understand your background and aspirations</p>
            </div>

            <div className="space-y-6">
              {/* Experience Level */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Experience Level</h3>
                <div className="space-y-3">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleInputChange('experience_level', level.value)}
                      className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${userData.experience_level === level.value
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-glass-border bg-glass-bg hover:border-accent-primary/50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-text-primary">{level.label}</h4>
                          <p className="text-text-secondary text-sm">{level.description}</p>
                        </div>
                        {userData.experience_level === level.value && (
                          <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-white text-xs"></i>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">What are your goals?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => handleGoalToggle(goal.value)}
                      className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-105 ${userData.goals.includes(goal.value)
                          ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                          : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                        }`}
                    >
                      <div className="text-center">
                        <h4 className="font-semibold mb-1">{goal.label}</h4>
                        <p className="text-xs opacity-80">{goal.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Complete */}
        {currentStep === 5 && (
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
                  <p className="text-text-secondary">{userData.role}</p>
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
                  <h4 className="font-medium text-text-primary mb-1">Location</h4>
                  <p className="text-text-secondary text-sm">{userData.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-1">Experience</h4>
                  <p className="text-text-secondary text-sm">{userData.experience_level}</p>
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

              {userData.goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.goals.map((goal) => (
                      <span key={goal} className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded-full text-sm">
                        {goal}
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
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${currentStep === 1
                ? 'bg-glass-bg text-text-secondary cursor-not-allowed'
                : 'bg-glass-bg text-text-primary hover:bg-glass-border hover:scale-105'
              }`}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
