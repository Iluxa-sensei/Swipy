import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '../context/FiltersContext'

const FiltersPage = () => {
  const navigate = useNavigate()
  const {
    filters,
    toggleCategory,
    toggleStage,
    toggleLocation,
    setTeamSize,
    setFunding,
    setInvestmentRequired,
    clearFilters,
    getActiveFiltersCount,
    updateFilters
  } = useFilters()



  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('categories')
  const [showPresets, setShowPresets] = useState(false)

  const categories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const stages = [
    "Idea", "MVP", "Seed", "Series A", "Series B", "Series C+"
  ]

  const locations = [
    "Remote", "Asia", "Europe", "North America", "South America", "Africa", "Australia"
  ]

  const teamSizes = [
    "1-5", "6-10", "11-25", "26-50", "50+"
  ]

  const fundingRanges = [
    "Bootstrapped", "Under $1K", "Under $10K", "Under $100K", "$500K+"
  ]

  const investmentRanges = [
    "Under $10K", "Under $50K", "Under $100K", "Under $500K", "Under $1M", "$1M+"
  ]



  // Filter presets
  const filterPresets = [
    {
      name: "Early Stage",
      description: "Startups in idea and MVP stage",
      filters: {
        categories: [],
        stages: ["Idea", "MVP"],
        locations: [],
        teamSize: "",
        funding: "",
        investmentRequired: ""
      }
    },
    {
      name: "Tech Focus",
      description: "AI/ML and FinTech startups",
      filters: {
        categories: ["AI/ML", "FinTech"],
        stages: [],
        locations: [],
        teamSize: "",
        funding: "",
        investmentRequired: ""
      }
    },
    {
      name: "Remote First",
      description: "Remote-friendly opportunities",
      filters: {
        categories: [],
        stages: [],
        locations: ["Remote"],
        teamSize: "",
        funding: "",
        investmentRequired: ""
      }
    },
    {
      name: "European Startups",
      description: "Startups based in Europe",
      filters: {
        categories: [],
        stages: [],
        locations: ["Europe"],
        teamSize: "",
        funding: "",
        investmentRequired: ""
      }
    }
  ]

  const applyFilters = () => {
    // Filters are already applied through context
    navigate('/home')
  }

  const applyPreset = (preset) => {
    updateFilters(preset.filters)
    setShowPresets(false)
  }

  const saveCurrentPreset = () => {
    const presetName = prompt("Enter preset name:")
    if (presetName) {
      const newPreset = {
        name: presetName,
        description: "Custom filter preset",
        filters: { ...filters }
      }
      // In a real app, this would save to localStorage or API
      alert(`Preset "${presetName}" saved!`)
    }
  }

  const getFilteredItems = (items) => {
    if (!searchQuery) return items
    return items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const tabs = [
    { id: 'categories', label: 'Categories', icon: 'fas fa-tags' },
    { id: 'stages', label: 'Stages', icon: 'fas fa-chart-line' },
    { id: 'locations', label: 'Locations', icon: 'fas fa-map-marker-alt' },
    { id: 'other', label: 'Other', icon: 'fas fa-cog' }
  ]

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={() => navigate('/home')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="flex items-center gap-2">
          Filters
          {getActiveFiltersCount() > 0 && (
            <span className="bg-accent-primary text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce-in">
              {getActiveFiltersCount()}
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <button className="header-btn" onClick={() => setShowPresets(true)}>
            <i className="fas fa-bookmark"></i>
          </button>
          <button className="header-btn" onClick={clearFilters}>
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-glass-border bg-bg-secondary/80">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-text-secondary"></i>
          </div>
          <input
            type="text"
            placeholder="Search filters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-bg-secondary/80 border border-glass-border rounded-3xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="p-4 bg-glass-bg border-b border-glass-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-primary font-medium">
              Active Filters ({getActiveFiltersCount()})
            </span>
            <button
              className="text-accent-primary text-sm font-medium hover:underline"
              onClick={clearFilters}
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.categories.map(cat => (
              <span key={cat} className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                {cat} <button onClick={() => toggleCategory(cat)} className="ml-1">×</button>
              </span>
            ))}
            {filters.stages.map(stage => (
              <span key={stage} className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                {stage} <button onClick={() => toggleStage(stage)} className="ml-1">×</button>
              </span>
            ))}
            {filters.locations.map(loc => (
              <span key={loc} className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                {loc} <button onClick={() => toggleLocation(loc)} className="ml-1">×</button>
              </span>
            ))}

            {filters.teamSize && (
              <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                Team: {filters.teamSize} <button onClick={() => setTeamSize(filters.teamSize)} className="ml-1">×</button>
              </span>
            )}
            {filters.funding && (
              <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                {filters.funding} <button onClick={() => setFunding(filters.funding)} className="ml-1">×</button>
              </span>
            )}
            {filters.investmentRequired && (
              <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                Investment: {filters.investmentRequired} <button onClick={() => setInvestmentRequired(filters.investmentRequired)} className="ml-1">×</button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto bg-glass-bg border-b border-glass-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
              ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-glass-border'
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredItems(categories).map((category) => (
                <button
                  key={category}
                  className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.categories.includes(category)
                    ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                    : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                    }`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stages Tab */}
        {activeTab === 'stages' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Funding Stage</h3>
            <div className="grid grid-cols-2 gap-3">
              {getFilteredItems(stages).map((stage) => (
                <button
                  key={stage}
                  className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.stages.includes(stage)
                    ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                    : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                    }`}
                  onClick={() => toggleStage(stage)}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Locations</h3>
            <div className="grid grid-cols-1 gap-3">
              {getFilteredItems(locations).map((location) => (
                <button
                  key={location}
                  className={`p-3 rounded-2xl border transition-all duration-200 text-left hover:scale-105 ${filters.locations.includes(location)
                    ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                    : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                    }`}
                  onClick={() => toggleLocation(location)}
                >
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {location}
                </button>
              ))}
            </div>
          </div>
        )}



        {/* Other Tab */}
        {activeTab === 'other' && (
          <div className="p-6 space-y-6 animate-fade-in">
            {/* Team Size */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Team Size</h3>
              <div className="grid grid-cols-2 gap-3">
                {teamSizes.map((size) => (
                  <button
                    key={size}
                    className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.teamSize === size
                      ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                      : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                      }`}
                    onClick={() => setTeamSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Funding</h3>
              <div className="grid grid-cols-2 gap-3">
                {fundingRanges.map((funding) => (
                  <button
                    key={funding}
                    className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.funding === funding
                      ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                      : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                      }`}
                    onClick={() => setFunding(funding)}
                  >
                    {funding}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Required */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Investment Required</h3>
              <div className="grid grid-cols-2 gap-3">
                {investmentRanges.map((amount) => (
                  <button
                    key={amount}
                    className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.investmentRequired === amount
                      ? 'bg-gradient-to-r from-blue-300 to-blue-700 border-blue-700 text-white shadow-lg'
                      : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                      }`}
                    onClick={() => setInvestmentRequired(amount)}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="p-6 border-t border-glass-border bg-bg-secondary/80">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn-secondary hover:scale-105 transition-transform duration-200"
            onClick={saveCurrentPreset}
          >
            <i className="fas fa-save"></i>
            Save Preset
          </button>
          <button
            className="bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white hover:scale-105 transition-transform duration-200 font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl"
            onClick={applyFilters}
          >
            <i className="fas fa-search"></i>
            Apply ({getActiveFiltersCount()})
          </button>
        </div>
      </div>

      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowPresets(false)}>
          <div className="w-full bg-bg-secondary rounded-t-3xl p-6 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-glass-border rounded-full mx-auto mb-4"></div>

            <h3 className="text-lg font-bold text-text-primary mb-4">Filter Presets</h3>

            <div className="space-y-3">
              {filterPresets.map((preset, index) => (
                <button
                  key={index}
                  className="w-full text-left p-4 bg-glass-bg border border-glass-border rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:bg-glass-border"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-text-primary">{preset.name}</h4>
                    <i className="fas fa-chevron-right text-text-secondary"></i>
                  </div>
                  <p className="text-sm text-text-secondary">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FiltersPage
