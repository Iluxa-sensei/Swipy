import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchJobs } from '../services/jobService'
import { useJobSearchFilters } from '../context/JobSearchFiltersContext.jsx'
import Loader from '../components/Loader.jsx'

const JOB_FILTER_OPTIONS = [
    { id: 'remote', label: 'Remote only', icon: 'fa-solid fa-globe' },
    { id: 'high-salary', label: 'Top compensation', icon: 'fa-solid fa-arrow-trend-up' },
    { id: 'senior', label: 'Senior & Lead', icon: 'fa-solid fa-user-tie' },
    { id: 'mid-level', label: 'Mid-level', icon: 'fa-solid fa-layer-group' },
    { id: 'junior', label: 'Junior & Intern', icon: 'fa-solid fa-seedling' },
    { id: 'full-time', label: 'Full-time', icon: 'fa-solid fa-clock' },
    { id: 'contract', label: 'Contract & Freelance', icon: 'fa-solid fa-briefcase' },
    { id: 'fast-growing', label: 'Fast-growing teams', icon: 'fa-solid fa-bolt' },
]
const MAX_JOB_FILTERS = 5

const JobSearchPage = () => {
    const navigate = useNavigate()
    const { jobFilters, setJobFilters } = useJobSearchFilters()
    const [query, setQuery] = useState('')
    const [jobs, setJobs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState(null)
    const [validationMsg, setValidationMsg] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef(null)

    // Close filter popover on outside click
    useEffect(() => {
        if (!isFilterOpen) return
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isFilterOpen])

    const toggleFilter = (id) => {
        setJobFilters((prev) => {
            if (prev.includes(id)) return prev.filter((f) => f !== id)
            if (prev.length >= MAX_JOB_FILTERS) return prev
            return [...prev, id]
        })
    }

    const handleSearch = useCallback(async () => {
        setValidationMsg('')
        setError(null)

        if (!query.trim()) {
            setValidationMsg('Please enter a keyword to search.')
            return
        }

        setIsLoading(true)
        setHasSearched(true)

        try {
            let effectiveQuery = query
            if (jobFilters && jobFilters.length > 0) {
                const extras = []
                if (jobFilters.includes('remote')) extras.push('remote OR "work from home"')
                if (jobFilters.includes('high-salary')) extras.push('"high salary" OR competitive')
                if (jobFilters.includes('senior')) extras.push('senior OR lead OR principal')
                if (jobFilters.includes('mid-level')) extras.push('mid')
                if (jobFilters.includes('junior')) extras.push('junior OR intern OR graduate')
                if (jobFilters.includes('full-time')) extras.push('"full time"')
                if (jobFilters.includes('contract')) extras.push('contract OR freelance')
                if (jobFilters.includes('fast-growing')) extras.push('startup OR scaleup')

                const filtersPart = extras.join(' ')
                effectiveQuery = `${query} ${filtersPart}`.trim()
            }

            const results = await searchJobs(effectiveQuery)
            setJobs(results)
        } catch (err) {
            console.error('Job search error:', err)
            setError('Something went wrong while searching. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [query, jobFilters])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch()
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Job Scanner</h1>
                <div className="relative" ref={filterRef}>
                    <button
                        className="header-btn relative"
                        onClick={() => setIsFilterOpen((v) => !v)}
                    >
                        <i className="fas fa-filter"></i>
                        {jobFilters.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5a8ceb] text-white text-[10px] font-bold flex items-center justify-center">
                                {jobFilters.length}
                            </span>
                        )}
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-glass-border bg-bg-primary shadow-xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3 border-b border-glass-border/60 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">Job Filters</p>
                                    <p className="text-[11px] text-text-secondary mt-0.5">Choose up to {MAX_JOB_FILTERS}</p>
                                </div>
                                {jobFilters.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setJobFilters([])}
                                        className="text-[11px] font-medium text-[#5a8ceb]"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Active chips */}
                            {jobFilters.length > 0 && (
                                <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5">
                                    {jobFilters.map((id) => {
                                        const f = JOB_FILTER_OPTIONS.find((o) => o.id === id)
                                        if (!f) return null
                                        return (
                                            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-[#5a8ceb]/15 text-[#5a8ceb] text-[11px] px-2.5 py-1">
                                                {f.label}
                                                <button type="button" onClick={() => toggleFilter(id)} className="ml-0.5">×</button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Options */}
                            <div className="max-h-64 overflow-y-auto px-2 py-2 space-y-1">
                                {JOB_FILTER_OPTIONS.map((filter) => {
                                    const isActive = jobFilters.includes(filter.id)
                                    const isDisabled = !isActive && jobFilters.length >= MAX_JOB_FILTERS
                                    return (
                                        <button
                                            key={filter.id}
                                            type="button"
                                            onClick={() => toggleFilter(filter.id)}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border ${isActive
                                                ? 'border-[#5a8ceb]/60 bg-[#5a8ceb]/10'
                                                : 'border-transparent hover:bg-bg-secondary'
                                                } ${isDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isActive ? 'bg-[#5a8ceb]/20 text-[#5a8ceb]' : 'bg-bg-tertiary text-text-secondary'
                                                }`}>
                                                <i className={filter.icon}></i>
                                            </div>
                                            <span className={`text-xs font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                {filter.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-3 pt-2 border-t border-glass-border/60 flex items-center justify-between">
                                <p className="text-[11px] text-text-secondary">
                                    {jobFilters.length === 0 ? 'No filters yet' : `${jobFilters.length} active`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen(false)}
                                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#5a8ceb] text-white hover:bg-[#4a7cd4] transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="p-4 space-y-4">
                    {/* Search Input */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm"></i>
                            <input
                                type="text"
                                placeholder="Search jobs, e.g. designer, react, remote..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                aria-label="Job search keyword"
                                className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent-primary/50 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            aria-label="Search jobs"
                            className="group relative bg-slate-900 w-64 border-2 border-[#5a8ceb] text-white text-base font-bold rounded-xl overflow-hidden transition-all duration-500 hover:border-[#7ba8f0] py-3 px-3 text-left before:absolute before:w-10 before:h-10 before:content-[''] before:right-2 before:top-1 before:z-10 before:bg-[#3b5fc7] before:rounded-full before:blur-lg before:transition-all before:duration-500 after:absolute after:z-10 after:w-16 after:h-16 after:content-[''] after:bg-[#1e3a8a] after:right-6 after:top-2 after:rounded-full after:blur-lg after:transition-all after:duration-500 hover:before:right-10 hover:before:-bottom-4 hover:before:blur hover:after:-right-6 hover:after:scale-110 disabled:opacity-50"
                        >
                            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                        </button>
                    </div>

                    {validationMsg && (
                        <p className="text-sm text-accent-warning px-1">{validationMsg}</p>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                            <i className="fas fa-exclamation-circle text-red-400 mr-2"></i>
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader />
                            <p className="text-text-secondary mt-4">Searching jobs...</p>
                        </div>
                    )}

                    {/* Results */}
                    {!isLoading && hasSearched && jobs.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs text-text-secondary px-1">
                                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found for "{query}"
                            </p>
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-bg-secondary border border-glass-border rounded-xl p-4 active:bg-bg-tertiary transition-colors cursor-pointer"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') navigate(`/jobs/${job.id}`)
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-12 h-12 ${job.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            <i className="fas fa-briefcase text-white text-sm"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-text-primary truncate">{job.title}</h3>
                                            <p className="text-sm text-text-secondary">{job.company}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                <span className="px-2 py-0.5 bg-bg-tertiary/60 border border-glass-border rounded-md text-[11px] text-text-secondary flex items-center gap-1">
                                                    <i className="fas fa-location-dot text-[9px]"></i>
                                                    {job.location}
                                                </span>
                                                {job.type && (
                                                    <span className="px-2 py-0.5 bg-bg-tertiary/60 border border-glass-border rounded-md text-[11px] text-text-secondary">
                                                        {job.type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-secondary mt-2 line-clamp-2">{job.shortDescription}</p>
                                            {job.salary && (
                                                <p className="text-sm font-semibold text-accent-primary mt-2">{job.salary}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && hasSearched && jobs.length === 0 && !error && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-5">
                                    <i className="fas fa-search text-2xl text-white"></i>
                                </div>
                                <h2 className="text-xl font-bold text-text-primary mb-3">No jobs found for "{query}"</h2>
                                <p className="text-text-secondary text-sm max-w-xs mx-auto">
                                    Try broader keywords like "developer", "designer", or "remote".
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Initial State */}
                    {!isLoading && !hasSearched && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-5">
                                    <i className="fas fa-briefcase text-2xl text-white"></i>
                                </div>
                                <h2 className="text-xl font-bold text-text-primary mb-3">Find Your Next Job</h2>
                                <p className="text-text-secondary text-sm max-w-xs mx-auto">
                                    Enter a keyword above to search through available positions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default JobSearchPage
