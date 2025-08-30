import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'

const AddPage = () => {
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const fileInputRef = useRef(null)

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
      positions: ['', '', ''],
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

  const locationOptions = [
    'Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Boston, MA',
    'Seattle, WA', 'Los Angeles, CA', 'Chicago, IL', 'London, UK', 'Berlin, Germany',
    'Toronto, Canada', 'Sydney, Australia', 'Singapore', 'Tokyo, Japan'
  ]

  const gradientOptions = [
    { value: 'bg-gradient-primary', label: 'Blue-Green', preview: 'bg-gradient-primary' },
    { value: 'bg-gradient-secondary', label: 'Purple-Blue', preview: 'bg-gradient-secondary' },
    { value: 'bg-gradient-tertiary', label: 'Pink-Red', preview: 'bg-gradient-tertiary' },
    { value: 'bg-gradient-quaternary', label: 'Red-Cyan', preview: 'bg-gradient-quaternary' },
    { value: 'bg-gradient-quinary', label: 'Cyan-Pink', preview: 'bg-gradient-quinary' },
    { value: 'bg-gradient-senary', label: 'Orange-Blue', preview: 'bg-gradient-senary' },
    { value: 'bg-gradient-septenary', label: 'Hot Pink', preview: 'bg-gradient-septenary' },
    { value: 'bg-gradient-octonary', label: 'Purple-Blue', preview: 'bg-gradient-octonary' },
    { value: 'bg-gradient-nonary', label: 'Blue-Cyan', preview: 'bg-gradient-nonary' },
    { value: 'bg-gradient-denary', label: 'Green-Cyan', preview: 'bg-gradient-denary' }
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

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Title */}


        <div className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Category *</label>
            <CustomSelect
              options={categories}
              value={formData.startup.category}
              onChange={handleCategoryChange}
              placeholder="Select a category"
            />
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
          </div>

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Stage</label>
            <CustomSelect
              options={stages}
              value={formData.startup.stage}
              onChange={(value) => handleInputChange('startup', 'stage', value)}
              placeholder="Select current stage"
            />
          </div>

          <div className="form-group">
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

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Funding Stage</label>
            <CustomSelect
              options={fundingOptions}
              value={formData.startup.funding}
              onChange={(value) => handleInputChange('startup', 'funding', value)}
              placeholder="Select funding stage"
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
                      ? 'bg-accent-primary border-accent-primary text-white'
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
            <label className="block text-text-primary font-medium mb-2">Team Size</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">1</span>
                <span className="text-text-primary font-medium">
                  {formData.startup.teamSize === '100' ? '100+' : (formData.startup.teamSize || '1')}
                </span>
                <span className="text-text-secondary text-sm">100+</span>
              </div>
              <input
                type="range"
                className="w-full h-2 bg-glass-bg border border-glass-border rounded-lg appearance-none cursor-pointer slider"
                min="1"
                max="100"
                value={formData.startup.teamSize || '1'}
                onChange={(e) => handleInputChange('startup', 'teamSize', e.target.value)}
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((formData.startup.teamSize || 1) - 1) / 99 * 100}%, #374151 ${((formData.startup.teamSize || 1) - 1) / 99 * 100}%, #374151 100%)`
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Location</label>
            <CustomSelect
              options={locationOptions}
              value={formData.startup.location}
              onChange={(value) => handleInputChange('startup', 'location', value)}
              placeholder="Select location"
            />
          </div>

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Card Gradient</label>
            <div className="grid grid-cols-5 gap-3">
              {gradientOptions.map((gradient) => (
                <button
                  key={gradient.value}
                  type="button"
                  className={`w-full h-12 rounded-xl border-2 transition-all duration-200 ${formData.startup.gradient === gradient.value
                    ? 'border-accent-primary scale-105 shadow-lg shadow-accent-primary/30'
                    : 'border-glass-border hover:border-accent-primary/50'
                    }`}
                  onClick={() => handleInputChange('startup', 'gradient', gradient.value)}
                >
                  <div className={`w-full h-full ${gradient.preview} rounded-lg`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="block text-text-primary font-medium mb-2">Open Positions</label>
            <div className="space-y-3">
              {formData.startup.positions.map((position, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                      placeholder={`Position ${index + 1}`}
                      value={position}
                      onChange={(e) => handleArrayChange('startup', 'positions', index, e.target.value)}
                    />
                    <div className="absolute top-0 right-0 h-full flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-text-secondary">{position.length}/50</span>
                    </div>
                  </div>
                  <button
                    className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 hover:border-red-400 transition-all duration-300 shadow-lg shadow-red-500/20"
                    onClick={() => removeArrayItem('startup', 'positions', index)}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                </div>
              ))}
              <button
                className="w-full p-3 bg-glass-bg border border-glass-border rounded-xl text-text-secondary hover:text-accent-primary hover:border-accent-primary transition-all duration-300 flex items-center justify-center"
                onClick={() => addArrayItem('startup', 'positions')}
              >
                <i className="fas fa-plus mr-2"></i>
                Add Position
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-6 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm sticky bottom-0">
          <button
            className="btn-accent w-full hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!formData.startup.name || !formData.startup.category || formData.startup.description.length > 100 || formData.startup.name.length > 15}
            onClick={() => {
              // Простая валидация и сохранение
              console.log('Startup data:', formData.startup)
              alert('Startup created successfully!')
              navigate('/home')
            }}
          >
            <i className="fas fa-save mr-2"></i>
            Create Startup
          </button>
        </div>
      </div>

      {/* Startup Card Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-sm transform -translate-y-20" onClick={(e) => e.stopPropagation()}>
            {/* Preview Card */}
            <div className="startup-card relative bg-bg-secondary rounded-3xl overflow-hidden shadow-heavy">
              {/* Header */}
              <div className="flex justify-between items-center p-4 bg-glass-bg/50">
                <h3 className="text-text-primary font-bold">Card Preview</h3>
                <button
                  className="w-8 h-8 rounded-full bg-glass-bg flex items-center justify-center text-text-secondary hover:text-text-primary"
                  onClick={() => setShowPreview(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddPage