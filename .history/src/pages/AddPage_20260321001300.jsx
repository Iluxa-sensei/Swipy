import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { startupService } from '../services'
import CustomDropdown from '../components/CustomDropdown'

const AddPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPreview, setShowPreview] = useState(false)
  const [previewFlipped, setPreviewFlipped] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdStartup, setCreatedStartup] = useState(null)
  const fileInputRef = useRef(null)



  const locationOptions = [
    'Remote', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Australia'
  ]

  const [formData, setFormData] = useState({
    startup: {
      name: '',
      category: '',
      stage: '',
      description: '',
      funding: '',
      fundingAmount: '',
      teamSize: '',
      location: '',
      locationContinent: '', // Add continent
      locationCountry: '', // Add country
      locationCity: '', // Add city
      website: '',
      pitchDeckUrl: '',
      investmentRequired: '', // Replace positions with investmentRequired
      investmentPercentage: '', // percentage of company
      ebitda: '', // EBITDA in USD/month
      image: null,
      logo: '',
      gradient: 'bg-gradient-primary'
    }
  })

  const categories = [
    'FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'SaaS',
    'AI/ML', 'Blockchain', 'Gaming', 'PropTech', 'FoodTech',
    'Social Media', 'Marketplace', 'IoT', 'Cybersecurity', 'CleanTech',
    'Other (Custom)'
  ]

  const stages = [
    'Idea Stage', 'MVP', 'Early Stage', 'Growth Stage', 'Scale Stage'
  ]

  const fundingOptions = [
    'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Bootstrapped'
  ]

  const newFundingOptions = [
    'Bootstrapped', 'Under $1K', 'Under $10K', 'Under $100K', '$500K+'
  ]

  const gradientOptions = [
    { value: 'bg-gradient-primary', label: 'White-Blue', preview: 'bg-gradient-primary' },
    { value: 'bg-gradient-secondary', label: 'Pink-Red', preview: 'bg-gradient-secondary' },
    { value: 'bg-gradient-tertiary', label: 'Blue-Cyan', preview: 'bg-gradient-tertiary' },
    { value: 'bg-gradient-quaternary', label: 'Green-Cyan', preview: 'bg-gradient-quaternary' },
    { value: 'bg-gradient-quinary', label: 'Pink-Yellow', preview: 'bg-gradient-quinary' },
    { value: 'bg-gradient-senary', label: 'Cyan-Pink', preview: 'bg-gradient-senary' },
    { value: 'bg-gradient-septenary', label: 'Pink-Purple', preview: 'bg-gradient-septenary' },
    { value: 'bg-gradient-octonary', label: 'Orange-Pink', preview: 'bg-gradient-octonary' },
    { value: 'bg-gradient-nonary', label: 'Pink-Orange', preview: 'bg-gradient-nonary' },
    { value: 'bg-gradient-denary', label: 'Purple-Pink', preview: 'bg-gradient-denary' }
  ]

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleArrayChange = (section, field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const addArrayItem = (section, field) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], '']
      }
    }))
  }

  const removeArrayItem = (section, field, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }))
  }

  const handleCategoryChange = (value) => {
    if (value === 'Other (Custom)') {
      setShowCustomCategory(true)
      setFormData(prev => ({
        ...prev,
        startup: { ...prev.startup, category: '' }
      }))
    } else {
      setShowCustomCategory(false)
      setFormData(prev => ({
        ...prev,
        startup: { ...prev.startup, category: value }
      }))
    }
  }

  const handleStageChange = (value) => {
    setFormData(prev => ({
      ...prev,
      startup: { ...prev.startup, stage: value }
    }))
  }

  const handleFundingChange = (value) => {
    setFormData(prev => ({
      ...prev,
      startup: { ...prev.startup, funding: value }
    }))
  }

  const handleLocationChange = (value) => {
    setFormData(prev => ({
      ...prev,
      startup: { ...prev.startup, location: value }
    }))
  }

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      setFormData(prev => ({
        ...prev,
        startup: { ...prev.startup, category: customCategory.trim() }
      }))
      setShowCustomCategory(false)
      setCustomCategory('')
    }
  }

  // Function to extract main color from gradient
  const getGradientColor = (gradientClass) => {
    const gradientMap = {
      'bg-gradient-primary': '#1565c0',
      'bg-gradient-secondary': '#f093fb',
      'bg-gradient-tertiary': '#4facfe',
      'bg-gradient-quaternary': '#43e97b',
      'bg-gradient-quinary': '#fa709a',
      'bg-gradient-senary': '#a8edea',
      'bg-gradient-septenary': '#ff9a9e',
      'bg-gradient-octonary': '#ffecd2',
      'bg-gradient-nonary': '#ff9a9e',
      'bg-gradient-denary': '#a18cd1'
    }
    return gradientMap[gradientClass] || '#2196f3'
  }

  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true
    try {
      new URL(url.trim())
      return true
    } catch {
      return false
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        startup: {
          ...prev.startup,
          image: reader.result
        }
      }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen active">
      {/* Header */}
      <div className="header">
        <button className="header-btn" onClick={() => navigate('/home')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-center flex-1">Create Startup</h1>
        <button
          className="header-btn"
          onClick={() => setShowPreview(true)}
          disabled={!formData.startup.name || !formData.startup.category || formData.startup.description.length > 100 || formData.startup.name.length > 15}
        >
          <i className="fas fa-eye"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20" style={{ overflowY: 'auto', overflowX: 'visible' }}>
        <div className="p-6 space-y-6" style={{ overflow: 'visible' }}>
          {/* Image Upload Section */}
          <div className="form-group" style={{ overflow: 'visible' }}>
            <label className="block text-text-primary font-medium mb-4">Startup Image</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-glass-bg border border-glass-border flex items-center justify-center">
                {formData.startup.image ? (
                  <img src={formData.startup.image} alt="startup" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-image text-3xl text-text-secondary"></i>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-primary text-sm py-2 px-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Choose Image
                </button>
                {formData.startup.image && (
                  <button
                    type="button"
                    className="btn-secondary text-sm py-2 px-4"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      startup: { ...prev.startup, image: null }
                    }))}
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="form-group" style={{ overflow: 'visible' }}>
            <label className="block text-text-primary font-medium mb-2">
              Startup Name *
              <span className={`ml-2 text-sm ${formData.startup.name.length > 15 ? 'text-red-400' : 'text-text-secondary'}`}>
                {formData.startup.name.length}/15
              </span>
            </label>
            <input
              type="text"
              className={`w-full p-4 bg-glass-bg border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none transition-all duration-300 hover:border-accent-primary/70 ${formData.startup.name.length > 15
                ? 'border-red-400 focus:border-red-400'
                : 'border-glass-border focus:border-accent-primary'
                }`}
              placeholder="Enter your startup name"
              value={formData.startup.name}
              onChange={(e) => handleInputChange('startup', 'name', e.target.value)}
              maxLength="15"
            />
          </div>

          {/* Custom Category Dropdown */}
          <div className="form-group" style={{ overflow: 'visible' }}>
            <CustomDropdown
              label="Category *"
              options={categories}
              value={formData.startup.category}
              onChange={handleCategoryChange}
              placeholder="Select a category"
              type="category"
            />
          </div>
          {showCustomCategory && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 bg-glass-bg border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300"
                placeholder="Enter custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary py-3 px-4"
                onClick={addCustomCategory}
                disabled={!customCategory.trim()}
              >
                Add
              </button>
            </div>
          )}

          {/* Custom Stage Dropdown */}
          <div className="form-group" style={{ overflow: 'visible' }}>
            <CustomDropdown
              label="Stage"
              options={stages}
              value={formData.startup.stage}
              onChange={handleStageChange}
              placeholder="Select a stage"
              type="stage"
            />
          </div>

          <div className="form-group" style={{ overflow: 'visible' }}>
            <label className="block text-text-primary font-medium mb-2">
              Description *
              <span className={`ml-2 text-sm ${formData.startup.description.length > 100 ? 'text-red-400' : 'text-text-secondary'}`}>
                {formData.startup.description.length}/100
              </span>
            </label>
            <textarea
              className={`w-full p-4 bg-glass-bg border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none transition-all duration-300 hover:border-accent-primary/70 ${formData.startup.description.length > 100
                ? 'border-red-400 focus:border-red-400'
                : 'border-glass-border focus:border-accent-primary'
                }`}
              rows="4"
              placeholder="Describe your startup in 100 characters or less"
              value={formData.startup.description}
              onChange={(e) => handleInputChange('startup', 'description', e.target.value)}
              maxLength="150"
            />
          </div>

          {/* Custom Funding Stage Dropdown */}
          <div className="form-group" style={{ overflow: 'visible' }}>
            <CustomDropdown
              label="Funding Stage"
              options={fundingOptions}
              value={formData.startup.funding}
              onChange={handleFundingChange}
              placeholder="Select funding stage"
              type="funding"
            />
          </div>

          {formData.startup.funding && (
            <div className="form-group">
              <label className="block text-text-primary font-medium mb-2">Funding Amount</label>
              <div className="grid grid-cols-2 gap-3">
                {newFundingOptions.map((funding) => (
                  <button
                    key={funding}
                    type="button"
                    className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${formData.startup.fundingAmount === funding
                      ? 'btn-icon-style'
                      : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                      }`}
                    onClick={() => handleInputChange('startup', 'fundingAmount', funding)}
                  >
                    {funding}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-3">Team Size</label>
            <div className="space-y-4">
              {/* Preset buttons for common team sizes */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1', value: '1' },
                  { label: '2-5', value: '3' },
                  { label: '6-10', value: '8' },
                  { label: '11-20', value: '15' },
                  { label: '21-50', value: '35' },
                  { label: '51-100', value: '75' },
                  { label: '100+', value: '100' }
                ].map((preset) => {
                  const currentValue = parseInt(formData.startup.teamSize || '1')
                  let isSelected = false
                  
                  if (preset.value === '1') {
                    isSelected = currentValue === 1
                  } else if (preset.value === '100') {
                    isSelected = currentValue >= 100
                  } else if (preset.value === '3') {
                    isSelected = currentValue >= 2 && currentValue <= 5
                  } else if (preset.value === '8') {
                    isSelected = currentValue >= 6 && currentValue <= 10
                  } else if (preset.value === '15') {
                    isSelected = currentValue >= 11 && currentValue <= 20
                  } else if (preset.value === '35') {
                    isSelected = currentValue >= 21 && currentValue <= 50
                  } else if (preset.value === '75') {
                    isSelected = currentValue >= 51 && currentValue <= 99
                  }
                  
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleInputChange('startup', 'teamSize', preset.value)}
                      className={`px-3 py-2 rounded-xl border transition-all duration-200 text-sm font-medium ${
                        isSelected
                          ? 'bg-accent-primary/20 border-accent-primary text-accent-primary shadow-lg shadow-accent-primary/20'
                          : 'bg-glass-bg border-glass-border text-text-primary hover:border-accent-primary/50 hover:bg-glass-border'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
              
              {/* Custom slider for precise selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-xs">1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-bold text-base">
                      {formData.startup.teamSize === '100' ? '100+' : (formData.startup.teamSize || '1')}
                    </span>
                    <span className="text-text-secondary text-xs">people</span>
                  </div>
                  <span className="text-text-secondary text-xs">100+</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2.5 bg-glass-bg border border-glass-border rounded-full appearance-none cursor-pointer slider"
                  min="1"
                  max="100"
                  value={formData.startup.teamSize || '1'}
                  onChange={(e) => handleInputChange('startup', 'teamSize', e.target.value)}
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((parseInt(formData.startup.teamSize || '1')) - 1) / 99 * 100}%, #374151 ${((parseInt(formData.startup.teamSize || '1')) - 1) / 99 * 100}%, #374151 100%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="form-group" style={{ overflow: 'visible' }}>
            <label className="block text-text-primary font-medium mb-2">Location</label>

            {/* Step 1: Select Continent/Remote */}
            <CustomDropdown
              label=""
              options={locationOptions}
              value={formData.startup.locationContinent}
              onChange={(value) => {
                handleInputChange('startup', 'locationContinent', value)
                if (value === 'Remote') {
                  handleInputChange('startup', 'location', 'Remote')
                  handleInputChange('startup', 'locationCountry', '')
                  handleInputChange('startup', 'locationCity', '')
                } else {
                  handleInputChange('startup', 'location', '')
                }
              }}
              placeholder="Select continent or Remote"
              type="location"
            />

            {/* Step 2: If continent selected, show country and city fields */}
            {formData.startup.locationContinent && formData.startup.locationContinent !== 'Remote' && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300"
                  placeholder="Country"
                  value={formData.startup.locationCountry}
                  onChange={(e) => {
                    handleInputChange('startup', 'locationCountry', e.target.value)
                    // Update full location name
                    const fullLocation = `${e.target.value}, ${formData.startup.locationCity || ''}`.trim()
                    handleInputChange('startup', 'location', fullLocation)
                  }}
                />
                <input
                  type="text"
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300"
                  placeholder="City"
                  value={formData.startup.locationCity}
                  onChange={(e) => {
                    handleInputChange('startup', 'locationCity', e.target.value)
                    // Update full location name
                    const fullLocation = `${formData.startup.locationCountry || ''}, ${e.target.value}`.trim()
                    handleInputChange('startup', 'location', fullLocation)
                  }}
                />
              </div>
            )}
          </div>

          {/* Website Field */}
          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Website</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-globe text-text-secondary"></i>
              </div>
              <input
                type="url"
                className="w-full pl-12 pr-4 py-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300"
                placeholder="https://yourstartup.com"
                value={formData.startup.website}
                onChange={(e) => handleInputChange('startup', 'website', e.target.value)}
                pattern="https?://.+"
              />
            </div>
          </div>

          {/* Pitch Deck URL Field */}
          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">
              Pitch Deck URL
              <span className="ml-2 text-sm text-text-secondary font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-file-pdf text-text-secondary"></i>
              </div>
              <input
                type="url"
                className="w-full pl-12 pr-4 py-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300"
                placeholder="https://drive.google.com/... or https://docs.google.com/..."
                value={formData.startup.pitchDeckUrl}
                onChange={(e) => handleInputChange('startup', 'pitchDeckUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Card Gradient</label>
            <div className="grid grid-cols-5 gap-3">
              {gradientOptions.map((gradient) => (
                <button
                  key={gradient.value}
                  type="button"
                  className={`w-full h-12 rounded-xl border-2 transition-all duration-200 ${formData.startup.gradient === gradient.value
                    ? 'border-blue-700 scale-105 shadow-lg shadow-blue-700/30'
                    : 'border-glass-border hover:border-blue-700/50'
                    }`}
                  onClick={() => handleInputChange('startup', 'gradient', gradient.value)}
                >
                  <div className={`w-full h-full ${gradient.preview} rounded-lg`}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Investment Required Section */}
          <div className="form-group">
            <label className="block text-text-primary font-medium mb-4">Investment Required</label>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-4 pr-12 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                  placeholder="Enter investment amount"
                  value={formData.startup.investmentRequired || ''}
                  onChange={(e) => handleInputChange('startup', 'investmentRequired', e.target.value)}
                  min="0"
                  step="1000"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-text-secondary font-semibold">$</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-text-secondary font-medium">for</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    className="w-full p-4 pr-12 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                    placeholder="10"
                    value={formData.startup.investmentPercentage || ''}
                    onChange={(e) => handleInputChange('startup', 'investmentPercentage', e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-text-secondary font-semibold">%</span>
                  </div>
                </div>
                <span className="text-text-secondary font-medium">of company</span>
              </div>
            </div>
          </div>

          {/* EBITDA Section */}
          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">EBITDA (USD/month)</label>
            <div className="relative">
              <input
                type="number"
                className="w-full p-4 pr-12 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                placeholder="Enter monthly EBITDA"
                value={formData.startup.ebitda || ''}
                onChange={(e) => handleInputChange('startup', 'ebitda', e.target.value)}
                min="0"
                step="100"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-text-secondary font-semibold">$/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-6 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm sticky bottom-0">
          <button
            className="btn-icon-style w-full font-semibold rounded-2xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.startup.name || !formData.startup.category || formData.startup.description.length > 100 || formData.startup.name.length > 15 || isSubmitting}
            onClick={async () => {
              if (!user?.id) {
                alert('Please sign in to create a startup')
                return
              }

              // Simple validation
              if (!formData.startup.name || !formData.startup.category || formData.startup.description.length > 100 || formData.startup.name.length > 15) {
                alert('Please fill in all required fields correctly')
                return
              }

              if (!isValidUrl(formData.startup.pitchDeckUrl)) {
                alert('Please enter a valid Pitch Deck URL, or leave it blank.')
                return
              }

              setIsSubmitting(true)

              try {
                // Create startup object for Supabase
                const newStartup = {
                  owner_id: user.id,
                  name: formData.startup.name,
                  description: formData.startup.description,
                  website: formData.startup.website,
                pitch_deck_url: formData.startup.pitchDeckUrl?.trim() ? formData.startup.pitchDeckUrl.trim() : null,
                  logo_url: formData.startup.image,
                  industry: formData.startup.category,
                  stage: formData.startup.stage,
                  funding_round: formData.startup.fundingAmount,
                  team_size: formData.startup.teamSize,
                  location: formData.startup.location,
                  gradient: formData.startup.gradient,
                  investment_required: formData.startup.investmentRequired,
                  investment_percentage: formData.startup.investmentPercentage ? parseFloat(formData.startup.investmentPercentage) : null,
                  ebitda: formData.startup.ebitda ? parseFloat(formData.startup.ebitda) : null
                }

                // Save startup to Supabase
                const { data, error } = await startupService.createStartup(newStartup)

                if (error) {
                  throw new Error(error.message)
                }

                // Show success modal
                setCreatedStartup(data)
                setShowSuccessModal(true)
              } catch (error) {
                console.error('Error creating startup:', error)
                alert(`Failed to create startup: ${error.message}`)
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
            {isSubmitting ? 'Creating...' : 'Create Startup'}
          </button>
        </div>
      </div>

      {/* Enhanced Startup Card Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-sm transform -translate-y-20" onClick={(e) => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="flex justify-between items-center p-4 bg-glass-bg/50 rounded-t-3xl">
              <h3 className="text-text-primary font-bold">Card Preview</h3>
              <div className="flex gap-2">
                <button
                  className="w-8 h-8 rounded-full bg-glass-bg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setPreviewFlipped(!previewFlipped)}
                >
                  <i className={`fas fa-sync-alt ${previewFlipped ? 'rotate-180' : ''}`}></i>
                </button>
                <button
                  className="w-8 h-8 rounded-full bg-glass-bg flex items-center justify-center text-text-secondary hover:text-text-primary"
                  onClick={() => setShowPreview(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="relative">
              <div className={`startup-card relative bg-bg-secondary rounded-3xl overflow-hidden shadow-heavy transition-transform duration-500 ${previewFlipped ? 'rotate-y-180' : ''}`}>
                {!previewFlipped ? (
                  // Front Side
                  <>
                    {/* Image */}
                    <div className={`relative h-48 ${formData.startup.gradient} overflow-hidden`}>
                      {formData.startup.image ? (
                        <img src={formData.startup.image} alt={formData.startup.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="company-logo">
                            <span className="text-white font-bold text-xl">{formData.startup.name ? formData.startup.name.substring(0, 2).toUpperCase() : 'ST'}</span>
                          </div>
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="gradient-overlay"></div>

                      {/* Badges */}
                      <div className="card-badges">
                        {formData.startup.fundingAmount && (
                          <span className="badge funding">{formData.startup.fundingAmount}</span>
                        )}
                        {formData.startup.stage && (
                          <span className="badge stage">{formData.startup.stage}</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title">{formData.startup.name || 'Startup Name'}</h3>
                        <div className="card-meta">
                          <span className="card-category">{formData.startup.category || 'Category'}</span>
                          {formData.startup.stage && (
                            <span className="card-stage">{formData.startup.stage}</span>
                          )}
                        </div>
                      </div>

                      <p className="card-description">
                        {formData.startup.description || 'No description provided'}
                      </p>
                    </div>
                  </>
                ) : (
                  // Back Side
                  <div className="h-full flex flex-col bg-bg-primary border border-glass-border">
                    {/* Header */}
                    <div className="p-4 border-b border-glass-border">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: `${getGradientColor(formData.startup.gradient)}20`,
                          }}
                        >
                          <span
                            className="font-bold text-lg"
                            style={{ color: getGradientColor(formData.startup.gradient) }}
                          >
                            {formData.startup.name ? formData.startup.name.substring(0, 2).toUpperCase() : 'ST'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary mb-1">{formData.startup.name || 'Startup Name'}</h3>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                              <i
                                className="fas fa-tag"
                                style={{ color: getGradientColor(formData.startup.gradient) }}
                              ></i>
                              {formData.startup.category || 'Category'}
                            </span>
                            <span className="flex items-center gap-1">
                              <i
                                className="fas fa-chart-line"
                                style={{ color: getGradientColor(formData.startup.gradient) }}
                              ></i>
                              {formData.startup.stage || 'Stage'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                      {/* About */}
                      <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                        <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                          <i
                            className="fas fa-info-circle"
                            style={{ color: getGradientColor(formData.startup.gradient) }}
                          ></i>
                          About
                        </h4>
                        <p className="text-text-secondary text-sm leading-relaxed">{formData.startup.description || 'No description provided'}</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                          <div
                            className="font-bold text-lg"
                            style={{ color: getGradientColor(formData.startup.gradient) }}
                          >
                            {formData.startup.fundingAmount || 'N/A'}
                          </div>
                          <div className="text-text-secondary text-xs mt-1">Funding</div>
                        </div>
                        <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                          <div
                            className="font-bold text-lg flex items-center justify-center gap-2"
                            style={{ color: getGradientColor(formData.startup.gradient) }}
                          >
                            <i className="fas fa-users text-sm"></i>
                            {formData.startup.teamSize || '1'}
                          </div>
                          <div className="text-text-secondary text-xs mt-1">Team Size</div>
                        </div>
                      </div>

                      {/* Website */}
                      {formData.startup.website && (
                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                            <i
                              className="fas fa-globe"
                              style={{ color: getGradientColor(formData.startup.gradient) }}
                            ></i>
                            Website
                          </h4>
                          <a
                            href={formData.startup.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-primary text-sm hover:underline break-all"
                          >
                            {formData.startup.website}
                          </a>
                        </div>
                      )}

                      {/* Investment Required */}
                      {formData.startup.investmentRequired && (
                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                            <i
                              className="fas fa-dollar-sign"
                              style={{ color: getGradientColor(formData.startup.gradient) }}
                            ></i>
                            Investment Required
                          </h4>
                          <div className="text-center space-y-2">
                            <div
                              className="px-4 py-2 rounded-lg text-lg font-bold"
                              style={{
                                backgroundColor: `${getGradientColor(formData.startup.gradient)}20`,
                                color: getGradientColor(formData.startup.gradient),
                                border: `1px solid ${getGradientColor(formData.startup.gradient)}30`
                              }}
                            >
                              ${formData.startup.investmentRequired}
                            </div>
                            {formData.startup.investmentPercentage && (
                              <div className="text-sm text-white/80">
                                for {formData.startup.investmentPercentage}% of company
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* EBITDA */}
                      {formData.startup.ebitda && (
                        <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                            <i
                              className="fas fa-chart-line"
                              style={{ color: getGradientColor(formData.startup.gradient) }}
                            ></i>
                            EBITDA
                          </h4>
                          <div className="text-center">
                            <span
                              className="px-4 py-2 rounded-lg text-lg font-bold"
                              style={{
                                backgroundColor: `${getGradientColor(formData.startup.gradient)}20`,
                                color: getGradientColor(formData.startup.gradient),
                                border: `1px solid ${getGradientColor(formData.startup.gradient)}30`
                              }}
                            >
                              ${formData.startup.ebitda}/month
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="w-full max-w-md bg-bg-secondary rounded-3xl p-8 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            {/* Success Icon */}
            <div className="state-icon state-icon-green animate-bounce">
              <i className="fas fa-check"></i>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-3">Startup Created Successfully!</h2>
              <p className="text-text-secondary leading-relaxed">
                Your startup <span className="font-semibold text-accent-primary">{createdStartup?.name}</span> has been created and is now live on the platform.
              </p>
            </div>

            {/* Startup Preview */}
            {createdStartup && (
              <div className="bg-glass-bg border border-glass-border rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${createdStartup.gradient || 'bg-gradient-primary'} rounded-xl flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">
                      {createdStartup.name?.substring(0, 2)?.toUpperCase() || 'ST'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{createdStartup.name}</h3>
                    <p className="text-sm text-text-secondary">{createdStartup.industry}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 px-4 bg-glass-bg border border-glass-border text-text-primary rounded-xl font-medium hover:bg-glass-border transition-all duration-200"
                onClick={() => setShowSuccessModal(false)}
              >
                Stay Here
              </button>
              <button
                className="flex-1 py-3 px-4 btn-icon-style rounded-xl font-medium"
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/home')
                }}
              >
                View on Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddPage