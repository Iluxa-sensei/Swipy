import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingTutorial from '../components/OnboardingTutorial'
import LocationSelector from '../components/LocationSelector'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [userData, setUserData] = useState({
    name: '',
    username: '', // Add username
    title: '',
    role: '', // Add role
    interests: [],
    location: '',
    locationContinent: '', // Add continent
    locationCountry: '', // Add country
    locationCity: '', // Add city
    bio: ''
  })
  const [showTutorial, setShowTutorial] = useState(false)



  const interestCategories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const locations = [
    'Remote', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Australia'
  ]

  const roles = [
    { value: 'founder', label: 'Founder', description: 'I want to create and grow startups' },
    { value: 'investor', label: 'Investor', description: 'I want to invest in promising startups' }
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

  const nextStep = () => {
    // Check if current step is valid before proceeding
    if (currentStep === 1) {
      if (!userData.name || !userData.username || !userData.title) {
        alert('Please fill in your name, username and professional title')
        return
      }
    } else if (currentStep === 2) {
      if (!userData.role) {
        alert('Please select your role (Founder or Investor)')
        return
      }
    } else if (currentStep === 3) {
      if (userData.interests.length === 0 || !userData.locationContinent) {
        alert('Please select at least one interest category and your preferred location')
        return
      }
      if (userData.locationContinent !== 'Remote' && (!userData.locationCountry || !userData.locationCity)) {
        alert('Please fill in both country and city for the selected continent')
        return
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    // Check that role is selected
    if (!userData.role) {
      alert('Please select your role (Founder or Investor)')
      return
    }

    // Ensure location is properly set
    if (userData.locationContinent === 'Remote') {
      userData.location = 'Remote'
    } else if (userData.locationContinent && userData.locationCountry && userData.locationCity) {
      userData.location = `${userData.locationCountry}, ${userData.locationCity}`
    }

    // Save user data to localStorage
    localStorage.setItem('profile_data', JSON.stringify({
      ...userData,
      createdAt: new Date().toISOString()
    }))

    // Show tutorial instead of going to main page
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    navigate('/home')
  }

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-user text-3xl text-white"></i>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Welcome to NextVentures!</h2>
      <p className="text-text-secondary mb-8">Let's get to know you better to find the perfect startup match.</p>

      <div className="space-y-6">
        <input
          type="text"
          placeholder="Your full name"
          value={userData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
        />

        <input
          type="text"
          placeholder="Professional title (e.g., Frontend Developer)"
          value={userData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
        />

        <input
          type="text"
          placeholder="Username (e.g., @yourname)"
          value={userData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
        />


      </div>
    </div>
  )

  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Role Selection</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-text-primary font-medium mb-3">Role *</label>
          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.value}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 text-left ${userData.role === role.value
                  ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => handleInputChange('role', role.value)}
              >
                <div className="text-left">
                  <div className="font-semibold text-lg">{role.label}</div>
                  <div className="text-sm opacity-80">{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Interests & Location</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-text-primary font-medium mb-3">Startup Categories of Interest</label>
          <div className="grid grid-cols-2 gap-3">
            {interestCategories.map((interest) => (
              <button
                key={interest}
                className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${userData.interests.includes(interest)
                  ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div>
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
  )

  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Final Details</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-text-primary font-medium mb-3">Bio</label>
          <textarea
            rows={4}
            placeholder="Tell us a bit about yourself, your goals, and what you're looking for in a startup..."
            value={userData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200 resize-none"
          />
        </div>

        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
          <h3 className="text-text-primary font-semibold mb-3">Profile Summary</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p><strong>Name:</strong> {userData.name || 'Not specified'}</p>
            <p><strong>Username:</strong> {userData.username || 'Not specified'}</p>
            <p><strong>Title:</strong> {userData.title || 'Not specified'}</p>
            <p><strong>Role:</strong> {userData.role ? (userData.role === 'founder' ? 'Founder' : 'Investor') : 'Not specified'}</p>
            <p><strong>Interests:</strong> {userData.interests.length > 0 ? userData.interests.join(', ') : 'Not specified'}</p>
            <p><strong>Location:</strong> {userData.locationContinent === 'Remote' ? 'Remote' : userData.location || 'Not specified'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  return (
    <div className="screen active">
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary text-sm">Step {currentStep} of 4</span>
            <span className="text-text-secondary text-sm">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-glass-bg rounded-full h-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              className="btn-secondary flex-1"
              onClick={prevStep}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Previous
            </button>
          )}

          {currentStep < 4 ? (
            <button
              className="btn-primary flex-1"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!userData.name || !userData.username || !userData.title)) ||
                (currentStep === 2 && !userData.role) ||
                (currentStep === 3 && (
                  userData.interests.length === 0 ||
                  !userData.locationContinent ||
                  (userData.locationContinent !== 'Remote' && (!userData.locationCountry || !userData.locationCity))
                ))
              }
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              onClick={completeOnboarding}
              disabled={!userData.bio}
            >
              <i className="fas fa-check mr-2"></i>
              Complete Setup
            </button>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}

export default OnboardingPage
