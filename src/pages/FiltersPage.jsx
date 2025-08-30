import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilters } from '../context/FiltersContext'

const FiltersPage = () => {
  const navigate = useNavigate()
  const {
    filters,
    toggleCategory,
    toggleStage,
    toggleLocation,
    toggleRole,
    setTeamSize,
    setFunding,
    clearFilters,
    getActiveFiltersCount
  } = useFilters()

  const categories = [
    "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
    "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
  ]

  const stages = [
    "Idea", "MVP", "Seed", "Series A", "Series B", "Series C+"
  ]

  const locations = [
    "San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA",
    "Seattle, WA", "Los Angeles, CA", "Chicago, IL", "Remote"
  ]

  const teamSizes = [
    "1-5", "6-10", "11-25", "26-50", "50+"
  ]

  const fundingRanges = [
    "Bootstrapped", "Under $1K", "Under $10K", "Under $100K", "$500K+"
  ]

  const roles = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Mobile Developer", "DevOps Engineer", "Data Scientist", "ML Engineer",
    "Product Manager", "UX Designer", "UI Designer", "Business Developer",
    "Marketing Manager", "Sales Manager", "CTO", "CEO"
  ]

  const applyFilters = () => {
    // Фильтры уже применены через контекст
    navigate('/home')
  }

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={() => navigate('/home')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Filters</h1>
        <button className="header-btn" onClick={clearFilters}>
          <i className="fas fa-undo"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Active Filters Count */}
        {getActiveFiltersCount() > 0 && (
          <div className="p-4 bg-glass-bg border-b border-glass-border">
            <div className="flex items-center justify-between">
              <span className="text-text-primary font-medium">
                {getActiveFiltersCount()} active filters
              </span>
              <button
                className="text-accent-primary text-sm font-medium hover:underline"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.categories.includes(category)
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Stages */}
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Funding Stage</h3>
          <div className="grid grid-cols-2 gap-3">
            {stages.map((stage) => (
              <button
                key={stage}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.stages.includes(stage)
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => toggleStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Locations</h3>
          <div className="grid grid-cols-1 gap-3">
            {locations.map((location) => (
              <button
                key={location}
                className={`p-3 rounded-2xl border transition-all duration-200 text-left hover:scale-105 ${filters.locations.includes(location)
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => toggleLocation(location)}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Team Size */}
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Team Size</h3>
          <div className="grid grid-cols-2 gap-3">
            {teamSizes.map((size) => (
              <button
                key={size}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.teamSize === size
                  ? 'bg-accent-primary border-accent-primary text-white'
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
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Funding</h3>
          <div className="grid grid-cols-2 gap-3">
            {fundingRanges.map((funding) => (
              <button
                key={funding}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:scale-105 ${filters.funding === funding
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => setFunding(funding)}
              >
                {funding}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Open Positions</h3>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role}
                className={`p-3 rounded-2xl border transition-all duration-200 text-sm hover:scale-105 ${filters.roles.includes(role)
                  ? 'bg-accent-primary border-accent-primary text-white'
                  : 'bg-glass-bg border-glass-border text-text-primary hover:bg-glass-border'
                  }`}
                onClick={() => toggleRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-6 border-t border-glass-border">
          <button
            className="btn-primary w-full hover:scale-105 transition-transform duration-200"
            onClick={applyFilters}
          >
            <i className="fas fa-search mr-2"></i>
            Apply Filters ({getActiveFiltersCount()})
          </button>
        </div>
      </div>
    </div>
  )
}

export default FiltersPage
