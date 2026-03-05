import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getJobById } from '../services/jobService'
import { JobSummaryContent } from '../components/JobSummaryContent'

const DesktopJobDetailsPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()
    const job = getJobById(id) || location.state?.job
    const [summary, setSummary] = useState(job?.fullDescription || '')
    const [summaryLoading, setSummaryLoading] = useState(!!job?.urlPlaceholder)
    const [summaryError, setSummaryError] = useState(null)

    useEffect(() => {
        let isCancelled = false

        const fetchSummary = async () => {
            if (!job?.urlPlaceholder || job.urlPlaceholder === '#') {
                setSummaryLoading(false)
                return
            }
            try {
                setSummaryLoading(true)
                setSummaryError(null)
                const res = await fetch('/api/job-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: job.urlPlaceholder,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        experience: job.experience,
                    }),
                })
                if (!res.ok) {
                    throw new Error(`Job summary error: ${res.status}`)
                }
                const data = await res.json()
                if (!isCancelled && data.summary) {
                    setSummary(data.summary)
                }
            } catch (err) {
                console.error('Failed to fetch job summary', err)
                if (!isCancelled) {
                    setSummaryError('Unable to fetch full description. Showing original snippet.')
                    setSummary(job.fullDescription)
                }
            } finally {
                if (!isCancelled) {
                    setSummaryLoading(false)
                }
            }
        }

        fetchSummary()

        return () => {
            isCancelled = true
        }
    }, [job])

    if (!job) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Job Not Found</h2>
                            <p className="text-text-secondary mb-8">This position may have been removed or the link is invalid.</p>
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/jobs')}
                            >
                                Back to Job Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            {/* Header with back button */}
            <div className="desktop-page-section !pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 flex items-center justify-center bg-bg-secondary/40 border border-glass-border rounded-xl text-text-primary hover:bg-glass-border transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{job.title}</h1>
                            <p className="text-text-secondary text-sm mt-1">{job.company}</p>
                        </div>
                    </div>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all flex items-center gap-2"
                        onClick={() => {
                            // TODO: Replace with real external job URL when available
                            // The URL should come from job.urlPlaceholder (or a real URL field)
                            window.open(job.urlPlaceholder || '#', '_blank', 'noopener,noreferrer')
                        }}
                    >
                        <i className="fas fa-external-link-alt"></i>
                        View Website
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="col-span-2 space-y-6">
                        {/* Hero Image */}
                        <div className="desktop-card !p-0 overflow-hidden">
                            <div className={`h-64 ${job.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} relative`}>
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                                        <i className="fas fa-briefcase text-4xl text-white"></i>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {job.type && (
                                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/30">
                                            {job.type}
                                        </span>
                                    )}
                                    {job.experience && (
                                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/30">
                                            {job.experience}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="desktop-card">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">About this role</h2>
                            <div className="text-text-secondary">
                                {summaryLoading
                                    ? 'Fetching full job details from the vacancy site…'
                                    : <JobSummaryContent text={summary} />}
                            </div>
                            {summaryError && (
                                <p className="text-xs text-accent-warning mt-3">{summaryError}</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <div className="desktop-card">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">Job Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                        <i className="fas fa-building text-text-secondary text-sm"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary">Company</p>
                                        <p className="text-sm font-medium text-text-primary">{job.company}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                        <i className="fas fa-location-dot text-text-secondary text-sm"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary">Location</p>
                                        <p className="text-sm font-medium text-text-primary">{job.location}</p>
                                    </div>
                                </div>
                                {job.salary && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                            <i className="fas fa-money-bill-wave text-text-secondary text-sm"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary">Salary</p>
                                            <p className="text-sm font-medium text-accent-primary">{job.salary}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                        <i className="fas fa-briefcase text-text-secondary text-sm"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary">Type</p>
                                        <p className="text-sm font-medium text-text-primary">{job.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                        <i className="fas fa-chart-line text-text-secondary text-sm"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary">Experience</p>
                                        <p className="text-sm font-medium text-text-primary">{job.experience}</p>
                                    </div>
                                </div>
                                {job.postedDate && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-bg-secondary/80 border border-glass-border rounded-xl flex items-center justify-center">
                                            <i className="fas fa-clock text-text-secondary text-sm"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary">Posted</p>
                                            <p className="text-sm font-medium text-text-primary">{job.postedDate}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {job.tags?.length > 0 && (
                            <div className="desktop-card">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">Skills & Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-xs text-accent-primary font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="desktop-card">
                            <button
                                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
                                onClick={() => {
                                    // TODO: Replace with real external job URL when available
                                    window.open(job.urlPlaceholder || '#', '_blank', 'noopener,noreferrer')
                                }}
                            >
                                <i className="fas fa-external-link-alt"></i>
                                View Website
                            </button>
                            <button
                                className="w-full py-3 mt-3 bg-bg-secondary/80 border border-glass-border text-text-secondary rounded-xl font-medium hover:bg-bg-secondary transition-colors flex items-center justify-center gap-2"
                                onClick={() => navigate('/jobs')}
                            >
                                <i className="fas fa-arrow-left text-sm"></i>
                                Back to Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DesktopJobDetailsPage
