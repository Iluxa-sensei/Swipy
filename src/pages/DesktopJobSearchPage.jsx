import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import JobCard from '../components/JobCard'
import { searchJobs } from '../services/jobService'
import { useJobSearchFilters } from '../context/JobSearchFiltersContext.jsx'
import Loader from '../components/Loader.jsx'

const DesktopJobSearchPage = () => {
    const navigate = useNavigate()
    const { jobFilters } = useJobSearchFilters()
    const [introVisible, setIntroVisible] = useState(true)
    const [introMounted, setIntroMounted] = useState(true)
    const [query, setQuery] = useState('')
    const [jobs, setJobs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState(null)
    const [validationMsg, setValidationMsg] = useState('')

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

            const filtersPart = extras.join(' ')
            return `${baseQuery} ${filtersPart}`.trim()
        },
        [jobFilters]
    )

    const handleSearch = useCallback(async () => {
        // fade out intro orbit cards when the user starts searching
        if (introVisible) {
            setIntroVisible(false)
            setTimeout(() => setIntroMounted(false), 500)
        }
        setValidationMsg('')
        setError(null)

        if (!query.trim()) {
            setValidationMsg('Please enter a keyword to search.')
            return
        }

        setIsLoading(true)
        setHasSearched(true)

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
    }, [query, buildQueryWithFilters, introVisible])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch()
    }

    // Loading state
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
            <div className="desktop-page-section" style={{ overflow: 'visible' }}>
                {/* Search Bar */}
                <div className="flex gap-3 mb-6">
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
                        className="group relative bg-slate-900 w-64 border-2 border-[#5a8ceb] text-white text-base font-bold rounded-xl overflow-hidden transition-all duration-500 hover:border-[#7ba8f0] py-3.5 px-3 text-left before:absolute before:w-10 before:h-10 before:content-[''] before:right-2 before:top-1 before:z-10 before:bg-[#3b5fc7] before:rounded-full before:blur-lg before:transition-all before:duration-500 after:absolute after:z-10 after:w-16 after:h-16 after:content-[''] after:bg-[#8bb4f5] after:right-6 after:top-2 after:rounded-full after:blur-lg after:transition-all after:duration-500 hover:before:right-10 hover:before:-bottom-4 hover:before:blur hover:after:-right-6 hover:after:scale-110 disabled:opacity-50"
                    >
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                    </button>
                </div>

                {validationMsg && (
                    <p className="text-sm text-accent-warning mb-4">{validationMsg}</p>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center mb-6">
                        <i className="fas fa-exclamation-circle text-red-400 mr-2"></i>
                        <span className="text-red-400">{error}</span>
                    </div>
                )}

                {/* Skeleton Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader />
                        <p className="text-text-secondary mt-4">Searching jobs...</p>
                    </div>
                )}

                {/* Results */}
                {!isLoading && hasSearched && jobs.length > 0 && (
                    <>
                        <p className="text-sm text-text-secondary mb-4">
                            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found for "{query}"
                        </p>
                        <div className="desktop-grid desktop-grid-3">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    title={job.title}
                                    company={job.company}
                                    location={job.location}
                                    shortDescription={job.shortDescription}
                                    salary={job.salary}
                                    type={job.type}
                                    gradient={job.gradient}
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!isLoading && hasSearched && jobs.length === 0 && !error && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-search text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">No jobs found for "{query}"</h2>
                            <p className="text-text-secondary mb-6 max-w-md mx-auto">
                                Try broader keywords like "developer", "designer", or "remote". You can also search by company name or location.
                            </p>
                        </div>
                    </div>
                )}

                {/* Initial State with orbiting cards */}
                {!isLoading && !error && introMounted && (
                    <div className="flex items-center justify-center py-16" style={{ overflow: 'visible' }}>
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
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">Find Your Next Job</h2>
                                <p className="text-text-secondary max-w-md mx-auto text-sm">
                                    Search through available positions by entering a keyword above — try a job title, skill, company, or location.
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
