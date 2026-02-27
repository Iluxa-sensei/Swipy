import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import JobCard from '../components/JobCard'
import { searchJobs } from '../services/jobService'

const DesktopJobSearchPage = () => {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [jobs, setJobs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState(null)
    const [validationMsg, setValidationMsg] = useState('')

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
            // TODO: Replace searchJobs with real API call
            const results = await searchJobs(query)
            setJobs(results)
        } catch (err) {
            console.error('Job search error:', err)
            setError('Something went wrong while searching. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [query])

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
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-briefcase text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading jobs...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            <div className="desktop-page-section">
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
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <>
                                <i className="fas fa-search"></i>
                                <span>Search</span>
                            </>
                        )}
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
                    <div className="desktop-grid desktop-grid-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="desktop-card animate-pulse">
                                <div className="flex flex-col gap-3">
                                    <div className="w-full h-28 bg-bg-tertiary rounded-xl"></div>
                                    <div className="h-5 bg-bg-tertiary rounded w-3/4"></div>
                                    <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-bg-tertiary rounded-lg w-24"></div>
                                        <div className="h-6 bg-bg-tertiary rounded-lg w-20"></div>
                                    </div>
                                    <div className="h-3 bg-bg-tertiary rounded w-full"></div>
                                    <div className="h-3 bg-bg-tertiary rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
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

                {/* Initial State */}
                {!isLoading && !hasSearched && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-briefcase text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Find Your Next Job</h2>
                            <p className="text-text-secondary mb-8 max-w-md mx-auto">
                                Search through available positions by entering a keyword above — try a job title, skill, company, or location.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesktopJobSearchPage
