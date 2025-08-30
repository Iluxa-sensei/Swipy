import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [userData, setUserData] = useState({
    name: '',
    title: '',
    experience: '',
    skills: [],
    interests: [],
    location: '',
    bio: ''
  })

  const experienceLevels = [
    "Entry Level (0-2 years)",
    "Mid Level (3-5 years)",
    "Senior Level (5+ years)",
    "Lead/Manager (7+ years)"
  ]

  const skillOptions = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript",
    "AWS", "Docker", "Kubernetes", "Machine Learning", "Data Science",
    "Product Management", "UX Design", "UI Design", "Marketing", "Sales"
  ]

  const interestCategories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const locations = [
    "San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA",
    "Seattle, WA", "Los Angeles, CA", "Chicago, IL", "Remote", "Other"
  ]

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillToggle = (skill) => {
    setUserData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
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
    // Здесь можно добавить логику сохранения данных
    navigate('/home')
  }

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-user text-3xl text-white"></i>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Welcome to NextVentures!</h2>
      <p className="text-text-secondary mb-8">Let's get to know you better to find the perfect startup match.</p>

      <div className="space-y-4">
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
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Experience & Skills</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-text-primary font-medium mb-3">Experience Level</label>
          <div className="space-y-3">
            {experienceLevels.map((level) => (
              <button
                key={level}
                className={`w-full p-4 rounded-2xl border transition-all duration-200 text-left ${userData.experience === level
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => handleInputChange('experience', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-text-primary font-medium mb-3">Skills (Select up to 5)</label>
          <div className="grid grid-cols-2 gap-3">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                className={`p-3 rounded-2xl border transition-all duration-200 text-sm ${userData.skills.includes(skill)
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => handleSkillToggle(skill)}
                disabled={!userData.skills.includes(skill) && userData.skills.length >= 5}
              >
                {skill}
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
                  ? 'bg-accent-primary border-accent-primary text-white'
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
          <label className="block text-text-primary font-medium mb-3">Preferred Location</label>
          <select
            value={userData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary focus:outline-none focus:border-accent-primary transition-colors duration-200"
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
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
            <p><strong>Title:</strong> {userData.title || 'Not specified'}</p>
            <p><strong>Experience:</strong> {userData.experience || 'Not specified'}</p>
            <p><strong>Skills:</strong> {userData.skills.length > 0 ? userData.skills.join(', ') : 'Not specified'}</p>
            <p><strong>Interests:</strong> {userData.interests.length > 0 ? userData.interests.join(', ') : 'Not specified'}</p>
            <p><strong>Location:</strong> {userData.location || 'Not specified'}</p>
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
                (currentStep === 1 && (!userData.name || !userData.title)) ||
                (currentStep === 2 && (!userData.experience || userData.skills.length === 0)) ||
                (currentStep === 3 && (userData.interests.length === 0 || !userData.location))
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
    </div>
  )
}

export default OnboardingPage
