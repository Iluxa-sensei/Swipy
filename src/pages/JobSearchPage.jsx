import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchJobs } from '../services/jobService'
import { getStarredJobs, addStarredJob, removeStarredJob } from '../services/starredJobsService'
import { useJobSearchFilters } from '../context/JobSearchFiltersContext.jsx'
import { useAuth } from '../hooks'
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
    const { user } = useAuth()
    const {
        jobFilters, setJobFilters,
        jobSearchQuery: query, setJobSearchQuery: setQuery,
        jobSearchResults: jobs, setJobSearchResults: setJobs,
        jobSearchHasSearched: hasSearched, setJobSearchHasSearched: setHasSearched,
    } = useJobSearchFilters()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [validationMsg, setValidationMsg] = useState('')
    const [starredIds, setStarredIds] = useState(() => new Set())
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef(null)

    useEffect(() => {
        if (!isFilterOpen) return
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isFilterOpen])

    useEffect(() => {
        let isMounted = true
        const loadStarred = async () => {
            if (!user?.id) {
                setStarredIds(new Set())
                return
            }
            const jobs = await getStarredJobs(user.id)
            if (!isMounted) return
            setStarredIds(new Set(jobs.map((job) => job.id)))
        }
        loadStarred()
        return () => {
            isMounted = false
        }
    }, [user?.id])

    const toggleFilter = (id) => {
        setJobFilters((prev) => {
            if (prev.includes(id)) return prev.filter((f) => f !== id)
            if (prev.length >= MAX_JOB_FILTERS) return prev
            return [...prev, id]
        })
    }

    const toggleStar = async (job, e) => {
        e?.stopPropagation()
        if (!user?.id) {
            console.warn('toggleStar: user not available')
            return
        }
        if (starredIds.has(job.id)) {
            await removeStarredJob(user.id, job.id)
            setStarredIds((prev) => {
                const next = new Set(prev)
                next.delete(job.id)
                return next
            })
        } else {
            await addStarredJob(user.id, job)
            setStarredIds((prev) => new Set([...prev, job.id]))
        }
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
            if (jobFilters?.length > 0) {
                const extras = []
                if (jobFilters.includes('remote')) extras.push('remote OR "work from home"')
                if (jobFilters.includes('high-salary')) extras.push('"high salary" OR competitive')
                if (jobFilters.includes('senior')) extras.push('senior OR lead OR principal')
                if (jobFilters.includes('mid-level')) extras.push('mid')
                if (jobFilters.includes('junior')) extras.push('junior OR intern OR graduate')
                if (jobFilters.includes('full-time')) extras.push('"full time"')
                if (jobFilters.includes('contract')) extras.push('contract OR freelance')
                if (jobFilters.includes('fast-growing')) extras.push('startup OR scaleup')
                effectiveQuery = `${query} ${extras.join(' ')}`.trim()
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
            <div className="header flex items-center justify-between">
                <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold text-text-primary">Job Scanner</h1>
                <div className="flex items-center gap-1">
                    <div className="relative" ref={filterRef}>
                        <button
                            type="button"
                            className="header-btn relative"
                            onClick={() => setIsFilterOpen((v) => !v)}
                            aria-label="Filters"
                        >
                            <i className="fas fa-filter"></i>
                            {jobFilters.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
                                    {jobFilters.length}
                                </span>
                            )}
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-glass-border bg-bg-primary shadow-xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden">
                                <div className="px-4 pt-4 pb-3 border-b border-glass-border/60 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">Job Filters</p>
                                        <p className="text-[11px] text-text-secondary mt-0.5">Choose up to {MAX_JOB_FILTERS}</p>
                                    </div>
                                    {jobFilters.length > 0 && (
                                        <button type="button" onClick={() => setJobFilters([])} className="text-[11px] font-medium text-accent-primary">
                                            Clear
                                        </button>
                                    )}
                                </div>
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
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${isActive ? 'border-accent-primary/60 bg-accent-primary/10' : 'border-transparent hover:bg-bg-secondary'} ${isDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isActive ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-tertiary text-text-secondary'}`}>
                                                    <i className={filter.icon}></i>
                                                </div>
                                                <span className={`text-xs font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>{filter.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="px-4 pb-3 pt-2 border-t border-glass-border/60">
                                    <button type="button" onClick={() => setIsFilterOpen(false)} className="w-full text-sm font-semibold py-2 rounded-xl bg-accent-primary text-white">
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="header-btn relative flex items-center"
                        onClick={() => navigate('/jobs/starred')}
                        aria-label="Starred jobs"
                    >
                        <i className="far fa-star"></i>
                        {starredIds.size > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-primary/90 text-white text-[10px] font-bold flex items-center justify-center">
                                {starredIds.size}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="p-4 space-y-4">
                    {/* Search: show big query when searched, else input */}
                    {hasSearched && query.trim() ? (
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-bold text-text-primary flex-1 min-w-0 truncate">{query.trim()}</h2>
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="w-10 h-10 rounded-full border border-glass-border bg-glass-bg flex items-center justify-center text-text-secondary flex-shrink-0"
                                aria-label="Edit search"
                            >
                                <i className="fas fa-magnifying-glass"></i>
                            </button>
                        </div>
                    ) : (
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
                                className="px-5 py-3 rounded-xl bg-accent-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                            >
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                            </button>
                        </div>
                    )}

                    {validationMsg && <p className="text-sm text-accent-warning px-1">{validationMsg}</p>}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                            <i className="fas fa-exclamation-circle text-red-400 mr-2"></i>
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader />
                            <p className="text-text-secondary mt-4 text-sm">Searching jobs...</p>
                        </div>
                    )}

                    {/* List of job rows (table-style on mobile: one row per job) */}
                    {!isLoading && hasSearched && jobs.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs text-text-secondary px-1">
                                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                            </p>
                            <div className="rounded-xl border border-glass-border overflow-hidden bg-bg-secondary/30">
                                {jobs.map((job) => (
                                    <div
                                        key={job.id}
                                        onClick={() => navigate(`/jobs/${job.id}`)}
                                        className="flex flex-col gap-3 p-4 border-b border-glass-border/50 last:border-b-0 active:bg-glass-bg/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={(e) => toggleStar(job, e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary flex-shrink-0 mt-0.5"
                                                aria-label={starredIds.has(job.id) ? 'Unstar' : 'Star'}
                                            >
                                                <i className={starredIds.has(job.id) ? 'fas fa-star text-accent-warning' : 'far fa-star'}></i>
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-text-primary font-semibold">{job.company}</p>
                                                <p className="text-text-primary font-medium text-sm">{job.title}</p>
                                                {job.salary && <p className="text-accent-primary text-xs mt-0.5">{job.salary}</p>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/jobs/${job.id}`)
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-accent-primary text-accent-primary font-semibold text-xs hover:bg-accent-primary hover:text-white transition-colors flex-shrink-0"
                                            >
                                                <i className="fas fa-external-link-alt text-[10px]"></i>
                                                View
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pl-11">
                                            {(job.tags || []).slice(0, 3).map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-glass-border text-[11px] text-text-secondary">
                                                    {tag}
                                                </span>
                                            ))}
                                            {job.type && (
                                                <span className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-glass-border text-[11px] text-text-secondary">
                                                    {job.type}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-xs line-clamp-2 pl-11">{job.shortDescription}</p>
                                        <p className="text-text-secondary text-xs pl-11 flex items-center gap-1">
                                            <i className="fas fa-location-dot text-[10px]"></i>
                                            {job.location}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isLoading && hasSearched && jobs.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="state-icon state-icon-sm state-icon-blue">
                                <i className="fas fa-search"></i>
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-3">No jobs found for "{query}"</h2>
                            <p className="text-text-secondary text-sm max-w-xs text-center">
                                Try broader keywords like "developer", "designer", or "remote".
                            </p>
                        </div>
                    )}

                    {!isLoading && !hasSearched && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="state-icon state-icon-sm state-icon-blue">
                                <i className="fas fa-briefcase"></i>
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-3">Find Your Next Job</h2>
                            <p className="text-text-secondary text-sm max-w-xs text-center">
                                Enter a keyword above to search. Use filters to narrow results.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default JobSearchPage
