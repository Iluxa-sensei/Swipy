import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { startupService } from '../services'
import CustomDropdown from '../components/CustomDropdown'

const DesktopAddPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFlipped, setPreviewFlipped] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdStartup, setCreatedStartup] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (profile && profile.role !== 'founder') {
      navigate('/home')
    }
  }, [profile, navigate])

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
      locationContinent: '',
      locationCountry: '',
      locationCity: '',
      website: '',
      pitchDeckUrl: '',
      investmentRequired: '',
      investmentPercentage: '',
      ebitda: '',
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

  const handleSubmit = async () => {
    if (!user?.id) {
      alert('Please sign in to create a startup')
      return
    }

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

      const data = await startupService.createStartup(newStartup)
      setCreatedStartup(data)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error creating startup:', error)
      alert(`Failed to create startup: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile && profile.role !== 'founder') {
    return null
  }

  return (
    <div className="desktop-page">
      <div className="desktop-page-header">
        <h1>Launch Your Startup</h1>
      </div>

      <div className="desktop-grid desktop-grid-3">
        {/* Left Side: Form */}
        <div className="col-span-2 space-y-6">
          <div className="desktop-page-section" style={{ overflow: 'visible' }}>
            <div className="desktop-page-section-header">
              <h2>Basic Information</h2>
            </div>
            
            <div className="space-y-6" style={{ overflow: 'visible' }}>
              <div className="form-group">
                <label className="block text-text-primary font-medium mb-4">Startup Image</label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden bg-glass-bg border-2 border-dashed border-glass-border flex items-center justify-center hover:border-accent-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {formData.startup.image ? (
                      <img src={formData.startup.image} alt="startup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-cloud-upload-alt text-3xl text-text-secondary mb-2"></i>
                        <p className="text-xs text-text-secondary">Upload Image</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="btn-primary rounded-full hover:scale-100 active:scale-100"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-upload mr-2"></i>
                      Choose Image
                    </button>
                    {formData.startup.image && (
                      <button
                        type="button"
                        className="btn-secondary rounded-full hover:scale-100 active:scale-100"
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

              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-text-primary font-medium mb-2">
                    Startup Name *
                    <span className={`ml-2 text-sm ${formData.startup.name.length > 15 ? 'text-red-400' : 'text-text-secondary'}`}>
                      {formData.startup.name.length}/15
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-4 bg-glass-bg border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none transition-all duration-300 ${formData.startup.name.length > 15 ? 'border-red-400' : 'border-glass-border focus:border-accent-primary'}`}
                    placeholder="Enter your startup name"
                    value={formData.startup.name}
                    onChange={(e) => handleInputChange('startup', 'name', e.target.value)}
                    maxLength="15"
                  />
                </div>

                <div className="form-group" style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}>
                  <CustomDropdown
                    label="Category *"
                    options={categories}
                    value={formData.startup.category}
                    onChange={handleCategoryChange}
                    placeholder="Select a category"
                    type="category"
                  />
                  {showCustomCategory && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 p-3 bg-glass-bg border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
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
                </div>
              </div>

              <div className="form-group">
                <label className="block text-text-primary font-medium mb-2">
                  Description *
                  <span className={`ml-2 text-sm ${formData.startup.description.length > 100 ? 'text-red-400' : 'text-text-secondary'}`}>
                    {formData.startup.description.length}/100
                  </span>
                </label>
                <textarea
                  className={`w-full p-4 bg-glass-bg border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none transition-all duration-300 ${formData.startup.description.length > 100 ? 'border-red-400' : 'border-glass-border focus:border-accent-primary'}`}
                  rows="3"
                  placeholder="Describe your startup in 100 characters or less"
                  value={formData.startup.description}
                  onChange={(e) => handleInputChange('startup', 'description', e.target.value)}
                  maxLength="150"
                />
              </div>
            </div>
          </div>

          <div className="desktop-page-section" style={{ overflow: 'visible', position: 'relative', zIndex: 40 }}>
            <div className="desktop-page-section-header">
              <h2>Market & Stage</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6" style={{ overflow: 'visible' }}>
              <CustomDropdown
                label="Stage"
                options={stages}
                value={formData.startup.stage}
                onChange={handleStageChange}
                placeholder="Select a stage"
                type="stage"
              />

              <CustomDropdown
                label="Location"
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

              {formData.startup.locationContinent && formData.startup.locationContinent !== 'Remote' && (
                <>
                  <input
                    type="text"
                    className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                    placeholder="Country"
                    value={formData.startup.locationCountry}
                    onChange={(e) => {
                      handleInputChange('startup', 'locationCountry', e.target.value)
                      const fullLocation = `${e.target.value}, ${formData.startup.locationCity || ''}`.trim()
                      handleInputChange('startup', 'location', fullLocation)
                    }}
                  />
                  <input
                    type="text"
                    className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                    placeholder="City"
                    value={formData.startup.locationCity}
                    onChange={(e) => {
                      handleInputChange('startup', 'locationCity', e.target.value)
                      const fullLocation = `${formData.startup.locationCountry || ''}, ${e.target.value}`.trim()
                      handleInputChange('startup', 'location', fullLocation)
                    }}
                  />
                </>
              )}

              <div className="form-group col-span-2">
                <label className="block text-text-primary font-medium mb-2">Website</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-globe text-text-secondary"></i>
                  </div>
                  <input
                    type="url"
                    className="w-full pl-12 pr-4 py-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                    placeholder="https://yourstartup.com"
                    value={formData.startup.website}
                    onChange={(e) => handleInputChange('startup', 'website', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group col-span-2">
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
                    className="w-full pl-12 pr-4 py-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                    placeholder="https://drive.google.com/... or https://docs.google.com/..."
                    value={formData.startup.pitchDeckUrl}
                    onChange={(e) => handleInputChange('startup', 'pitchDeckUrl', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group col-span-2">
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
                          className={`px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
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
                        <span className="text-text-primary font-bold text-lg">
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
            </div>
          </div>

          <div className="desktop-page-section" style={{ overflow: 'visible', position: 'relative', zIndex: 30 }}>
            <div className="desktop-page-section-header">
              <h2>Investment & Finance</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6" style={{ overflow: 'visible' }}>
              <div className="col-span-2">
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
                <div className="form-group col-span-2">
                  <label className="block text-text-primary font-medium mb-2">Funding Amount</label>
                  <div className="grid grid-cols-5 gap-3">
                    {newFundingOptions.map((funding) => (
                      <button
                        key={funding}
                        type="button"
                        className={`p-3 rounded-xl border transition-all duration-200 ${formData.startup.fundingAmount === funding
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'}`}
                        onClick={() => handleInputChange('startup', 'fundingAmount', funding)}
                      >
                        {funding}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="block text-text-primary font-medium mb-2">Investment Required ($)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                  placeholder="e.g. 500000"
                  value={formData.startup.investmentRequired || ''}
                  onChange={(e) => handleInputChange('startup', 'investmentRequired', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="block text-text-primary font-medium mb-2">Equity Offering (%)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                  placeholder="e.g. 10"
                  value={formData.startup.investmentPercentage || ''}
                  onChange={(e) => handleInputChange('startup', 'investmentPercentage', e.target.value)}
                />
              </div>

              <div className="form-group col-span-2">
                <label className="block text-text-primary font-medium mb-2">EBITDA (USD/month)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary"
                  placeholder="e.g. 5000"
                  value={formData.startup.ebitda || ''}
                  onChange={(e) => handleInputChange('startup', 'ebitda', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Preview & Visuals */}
        <div className="space-y-6">
          <div className="desktop-page-section sticky top-8">
            <div className="desktop-page-section-header">
              <h2>Card Preview</h2>
              <button
                className="w-10 h-10 rounded-full bg-glass-bg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                onClick={() => setPreviewFlipped(!previewFlipped)}
              >
                <i className={`fas fa-sync-alt ${previewFlipped ? 'rotate-180' : ''}`}></i>
              </button>
            </div>

            <div className="mb-8">
              <div className={`startup-card relative bg-bg-secondary rounded-3xl overflow-hidden shadow-heavy transition-transform duration-500 mx-auto ${previewFlipped ? 'rotate-y-180' : ''}`} style={{ width: '320px', height: '480px' }}>
                {!previewFlipped ? (
                  <>
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
                      <div className="gradient-overlay"></div>
                      <div className="card-badges">
                        {formData.startup.fundingAmount && <span className="badge funding">{formData.startup.fundingAmount}</span>}
                        {formData.startup.stage && <span className="badge stage">{formData.startup.stage}</span>}
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title text-xl font-bold mb-1">{formData.startup.name || 'Startup Name'}</h3>
                        <div className="card-meta">
                          <span className="card-category">{formData.startup.category || 'Category'}</span>
                        </div>
                      </div>
                      <p className="card-description mt-3">
                        {formData.startup.description || 'Describe your vision here...'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col bg-bg-primary border border-glass-border">
                    <div className="p-4 border-b border-glass-border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getGradientColor(formData.startup.gradient)}20` }}>
                          <span className="font-bold text-lg" style={{ color: getGradientColor(formData.startup.gradient) }}>
                            {formData.startup.name ? formData.startup.name.substring(0, 2).toUpperCase() : 'ST'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-text-primary">{formData.startup.name || 'Startup Name'}</h3>
                          <p className="text-xs text-text-secondary">{formData.startup.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                      <div className="bg-black/30 rounded-xl p-3">
                        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-2">About</h4>
                        <p className="text-sm text-text-primary leading-relaxed">{formData.startup.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/30 rounded-xl p-3 text-center">
                          <div className="font-bold text-lg text-blue-400">{formData.startup.fundingAmount || '—'}</div>
                          <div className="text-[10px] text-text-secondary uppercase">Funding</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3 text-center">
                          <div className="font-bold text-lg text-blue-400">{formData.startup.teamSize || '1'}</div>
                          <div className="text-[10px] text-text-secondary uppercase">Team</div>
                        </div>
                      </div>
                      {formData.startup.investmentRequired && (
                        <div className="bg-black/30 rounded-xl p-3">
                          <h4 className="text-[10px] font-semibold text-text-secondary uppercase mb-2">Investment</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-400">${formData.startup.investmentRequired}</span>
                            <span className="text-sm text-text-secondary">{formData.startup.investmentPercentage}% Equity</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-text-primary font-medium mb-4">Card Theme</label>
              <div className="grid grid-cols-5 gap-3">
                {gradientOptions.map((gradient) => (
                  <button
                    key={gradient.value}
                    type="button"
                    className={`w-full h-10 rounded-xl border-2 transition-all ${formData.startup.gradient === gradient.value ? 'border-blue-500 scale-110' : 'border-glass-border hover:border-glass-border/80'}`}
                    onClick={() => handleInputChange('startup', 'gradient', gradient.value)}
                  >
                    <div className={`w-full h-full ${gradient.preview} rounded-lg`}></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20 disabled:opacity-50 rounded-full hover:scale-100 active:scale-100"
                disabled={!formData.startup.name || !formData.startup.category || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Launching...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket mr-2"></i>
                    Launch Startup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-bg-secondary rounded-[40px] p-10 text-center shadow-2xl animate-scale-up border border-glass-border">
            <div className="state-icon state-icon-green" style={{marginBottom: '32px'}}>
              <i className="fas fa-check"></i>
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Successfully Launched!</h2>
            <p className="text-text-secondary mb-10 leading-relaxed">
              Your startup <span className="text-white font-bold">{createdStartup?.name}</span> is now live and visible to all investors on Swipy.
            </p>
            <div className="flex gap-4">
              <button className="btn-secondary flex-1 py-4 rounded-full" onClick={() => setShowSuccessModal(false)}>Stay Here</button>
              <button className="btn-primary flex-1 py-4 rounded-full" onClick={() => navigate('/home')}>Go to Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopAddPage

