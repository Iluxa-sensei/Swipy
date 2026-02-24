import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchJobs } from '../data/mockJobs'

const JobSearchPage = () => {
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

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Job Scanner</h1>
                <div className="w-10"></div>
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
                            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-blue-800 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
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
                        <div className="space-y-3 pt-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-bg-secondary border border-glass-border rounded-xl p-4 animate-pulse">
                                    <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-3"></div>
                                    <div className="h-3 bg-bg-tertiary rounded w-1/2 mb-2"></div>
                                    <div className="flex gap-2 mb-3">
                                        <div className="h-5 bg-bg-tertiary rounded-lg w-20"></div>
                                        <div className="h-5 bg-bg-tertiary rounded-lg w-16"></div>
                                    </div>
                                    <div className="h-3 bg-bg-tertiary rounded w-full mb-1"></div>
                                    <div className="h-3 bg-bg-tertiary rounded w-2/3"></div>
                                </div>
                            ))}
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
                                                <span className="px-2 py-0.5 bg-bg-tertiary/60 border border-glass-border rounded-md text-[11px] text-text-secondary">
                                                    {job.type}
                                                </span>
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
