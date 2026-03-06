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
const RESULTS_PER_PAGE = 6

const DesktopJobSearchPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const {
        jobFilters, setJobFilters,
        jobSearchQuery: query, setJobSearchQuery: setQuery,
        jobSearchResults: jobs, setJobSearchResults: setJobs,
        jobSearchHasSearched: hasSearched, setJobSearchHasSearched: setHasSearched,
        jobSearchCurrentPage: currentPage, setJobSearchCurrentPage: setCurrentPage,
    } = useJobSearchFilters()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [validationMsg, setValidationMsg] = useState('')
    const [starredIds, setStarredIds] = useState(() => new Set())
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [showSearchInput, setShowSearchInput] = useState(() => !hasSearched)
    const [introVisible, setIntroVisible] = useState(() => !hasSearched)
    const [introMounted, setIntroMounted] = useState(() => !hasSearched)
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

    const buildQueryWithFilters = useCallback(
        (baseQuery) => {
            if (!jobFilters || jobFilters.length === 0) return baseQuery
            const extras = []
            if (jobFilters.includes('remote')) extras.push('remote OR "work from home"')
            if (jobFilters.includes('high-salary')) extras.push('"high salary" OR competitive')
            if (jobFilters.includes('senior')) extras.push('senior OR lead OR principal')
            if (jobFilters.includes('mid-level')) extras.push('mid')
            if (jobFilters.includes('junior')) extras.push('junior OR intern OR graduate')
            if (jobFilters.includes('full-time')) extras.push('"full time"')
            if (jobFilters.includes('contract')) extras.push('contract OR freelance')
            if (jobFilters.includes('fast-growing')) extras.push('startup OR scaleup')
            return `${baseQuery} ${extras.join(' ')}`.trim()
        },
        [jobFilters]
    )

    const handleSearch = useCallback(async () => {
        if (query.trim()) {
            if (introVisible) {
                setIntroVisible(false)
                setTimeout(() => setIntroMounted(false), 500)
            }
            setValidationMsg('')
            setError(null)
            setIsLoading(true)
            setHasSearched(true)
            setShowSearchInput(false)
            setCurrentPage(1)
            try {
                const effectiveQuery = buildQueryWithFilters(query)
                const results = await searchJobs(effectiveQuery)
                setJobs(results)
            } catch (err) {
                console.error('Job search error:', err)
                setError('Something went wrong while searching. Please try again.')
            } finally {
                setIsLoading(false)
            }
        } else {
            setValidationMsg('Please enter a keyword to search.')
        }
    }, [query, buildQueryWithFilters, introVisible])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch()
    }

    const totalPages = Math.max(1, Math.ceil(jobs.length / RESULTS_PER_PAGE))
    const pageJobs = jobs.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE)

    if (isLoading && !hasSearched) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <div className="text-text-secondary mt-4">Loading jobs...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page" style={{ overflow: 'visible' }}>
            <div className="desktop-page-section jobs-page-table-section" style={{ overflow: 'visible' }}>
                {/* Top bar: left label, right actions (Filter, Starred) */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-semibold text-text-primary">Job Scanner</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={filterRef}>
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen((v) => !v)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg text-text-primary text-sm font-medium hover:bg-glass-border transition-colors"
                            >
                                <i className="fas fa-filter text-text-secondary"></i>
                                Filter
                                {jobFilters.length > 0 && (
                                    <span className="min-w-[18px] h-[18px] rounded-full bg-accent-primary text-white text-xs font-bold flex items-center justify-center">
                                        {jobFilters.length}
                                    </span>
                                )}
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-glass-border bg-bg-primary shadow-heavy z-50 overflow-hidden">
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
                                        <button type="button" onClick={() => setIsFilterOpen(false)} className="w-full text-sm font-semibold py-2 rounded-xl bg-accent-primary text-white hover:opacity-90 transition-opacity">
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/jobs/starred')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg text-text-primary text-sm font-medium hover:bg-glass-border transition-colors"
                            aria-label="Starred jobs"
                        >
                            <i className="far fa-star text-text-secondary"></i>
                            Starred
                            {starredIds.size > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center">
                                    {starredIds.size}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search: big query line when searched, or input when not */}
                <div className="mb-6">
                    {hasSearched && query.trim() && !showSearchInput ? (
                        <div className="flex items-center gap-4 flex-wrap">
                            <h2 className="text-2xl font-bold text-text-primary">{query.trim()}</h2>
                            <button
                                type="button"
                                onClick={() => setShowSearchInput(true)}
                                className="w-10 h-10 rounded-full border border-glass-border bg-glass-bg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-border transition-colors"
                                aria-label="Edit search"
                            >
                                <i className="fas fa-magnifying-glass"></i>
                            </button>
                            {jobs.length > 0 && (
                                <div className="ml-auto flex items-center gap-2 text-text-secondary text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="w-8 h-8 rounded-lg border border-glass-border bg-glass-bg flex items-center justify-center disabled:opacity-40"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <span>
                                        Page {currentPage}/{totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="w-8 h-8 rounded-lg border border-glass-border bg-glass-bg flex items-center justify-center disabled:opacity-40"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
                                    <input
                                        type="text"
                                        placeholder="Search jobs by title, company, skill, or location..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        aria-label="Job search keyword"
                                        className="w-full pl-11 pr-4 py-3.5 bg-bg-secondary/80 border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary/50 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                    aria-label="Search jobs"
                                    className="px-6 py-3.5 rounded-xl bg-accent-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                                </button>
                            </div>
                            {hasSearched && query.trim() && (
                                <button type="button" onClick={() => setShowSearchInput(false)} className="text-text-secondary hover:text-text-primary text-sm self-start">
                                    Cancel
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {validationMsg && <p className="text-sm text-accent-warning mb-4">{validationMsg}</p>}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center mb-6">
                        <i className="fas fa-exclamation-circle text-red-400 mr-2"></i>
                        <span className="text-red-400">{error}</span>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader />
                        <p className="text-text-secondary mt-4">Searching jobs...</p>
                    </div>
                )}

                {/* Table-style results */}
                {!isLoading && hasSearched && jobs.length > 0 && (
                    <div className="jobs-table-wrapper rounded-xl border border-glass-border overflow-hidden bg-bg-secondary/30">
                        <div className="jobs-table-header grid grid-cols-[auto_1fr_1fr_1fr_2fr_auto] gap-4 px-5 py-3 border-b border-glass-border bg-bg-secondary/50 text-text-secondary text-xs font-semibold uppercase tracking-wider">
                            <div className="w-8"></div>
                            <div>Company</div>
                            <div>Role</div>
                            <div>Location</div>
                            <div className="flex items-center gap-1">
                                Summary
                                <i className="fas fa-sort text-[10px] opacity-60"></i>
                            </div>
                            <div className="w-24"></div>
                        </div>
                        {pageJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className="jobs-table-row grid grid-cols-[auto_1fr_1fr_1fr_2fr_auto] gap-4 px-5 py-4 border-b border-glass-border/50 last:border-b-0 hover:bg-glass-bg/50 transition-colors cursor-pointer items-center"
                            >
                                <button
                                    type="button"
                                    onClick={(e) => toggleStar(job, e)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-accent-warning transition-colors"
                                    aria-label={starredIds.has(job.id) ? 'Unstar' : 'Star'}
                                >
                                    <i className={starredIds.has(job.id) ? 'fas fa-star text-accent-warning' : 'far fa-star'}></i>
                                </button>
                                <div className="min-w-0">
                                    <span className="text-text-primary font-medium truncate block">{job.company}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-text-primary font-medium truncate block">{job.title}</span>
                                    {job.salary && (
                                        <span className="text-accent-primary text-xs mt-0.5 block">{job.salary}</span>
                                    )}
                                </div>
                                <div className="min-w-0 text-text-secondary text-sm truncate">{job.location}</div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap gap-1.5 mb-1">
                                        {(job.tags || []).slice(0, 3).map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-glass-border text-xs text-text-secondary">
                                                {tag}
                                            </span>
                                        ))}
                                        {job.type && (
                                            <span className="px-2 py-0.5 rounded-md bg-bg-tertiary border border-glass-border text-xs text-text-secondary">
                                                {job.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-secondary text-sm line-clamp-2">{job.shortDescription}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/jobs/${job.id}`)
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-accent-primary text-accent-primary font-semibold text-sm hover:bg-accent-primary hover:text-white transition-colors"
                                >
                                    <i className="fas fa-external-link-alt text-[10px]"></i>
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && hasSearched && jobs.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-search text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">No jobs found for "{query}"</h2>
                        <p className="text-text-secondary mb-6 max-w-md text-center">
                            Try broader keywords like "developer", "designer", or "remote". You can also search by company name or location.
                        </p>
                    </div>
                )}

                {!hasSearched && !isLoading && introMounted && (
                    <div className="flex flex-col items-center justify-center py-16" style={{ overflow: 'visible' }}>
                        <div className="text-center space-y-6" style={{ overflow: 'visible' }}>
                            <div className={`jobs-orbit-wrapper ${introVisible ? 'jobs-orbit-visible' : 'jobs-orbit-hidden'}`}>
                                <div className="jobs-orbit-inner" style={{ '--quantity': 10 }}>
                                    <div className="jobs-orbit-card" style={{ '--index': 0, '--color-card': '142, 249, 252' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 1, '--color-card': '142, 252, 204' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 2, '--color-card': '142, 252, 157' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 3, '--color-card': '215, 252, 142' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 4, '--color-card': '252, 252, 142' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 5, '--color-card': '252, 208, 142' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 6, '--color-card': '252, 142, 142' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 7, '--color-card': '252, 142, 239' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 8, '--color-card': '204, 142, 252' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                    <div className="jobs-orbit-card" style={{ '--index': 9, '--color-card': '142, 202, 252' }}>
                                        <div className="jobs-orbit-img" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-16">
                                <h2 className="text-xl font-bold text-text-primary mb-2">Find Your Next Job</h2>
                                <p className="text-text-secondary max-w-md mx-auto text-sm">
                                    Search by job title, skill, company, or location. Use filters to narrow results.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesktopJobSearchPage
