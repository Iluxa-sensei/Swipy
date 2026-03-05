import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getJobById } from '../services/jobService'
import { JobSummaryContent } from '../components/JobSummaryContent'

const JobDetailsPage = () => {
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
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Job Not Found</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Job Not Found</h2>
                        <p className="text-text-secondary mb-8">This position may have been removed or the link is invalid.</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => navigate('/jobs')}
                        >
                            Back to Job Search
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="truncate">{job.title}</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                {/* Hero Gradient */}
                <div className={`w-full h-44 ${job.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} relative`}>
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                            <i className="fas fa-briefcase text-3xl text-white"></i>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex gap-2">
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

                <div className="p-5 space-y-5">
                    {/* Title & Company */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-1">{job.title}</h2>
                        <p className="text-text-secondary">{job.company}</p>
                    </div>

                    {/* Info Pills */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-bg-secondary border border-glass-border rounded-xl text-sm text-text-secondary flex items-center gap-1.5">
                            <i className="fas fa-location-dot text-xs"></i>
                            {job.location}
                        </span>
                        {job.salary && (
                            <span className="px-3 py-1.5 bg-bg-secondary border border-glass-border rounded-xl text-sm text-accent-primary font-medium flex items-center gap-1.5">
                                <i className="fas fa-money-bill-wave text-xs"></i>
                                {job.salary}
                            </span>
                        )}
                        {job.postedDate && (
                            <span className="px-3 py-1.5 bg-bg-secondary border border-glass-border rounded-xl text-sm text-text-secondary flex items-center gap-1.5">
                                <i className="fas fa-clock text-xs"></i>
                                {job.postedDate}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {job.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {job.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-xs text-accent-primary"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">About this role</h3>
                        <div className="text-sm text-text-secondary">
                            {summaryLoading
                                ? 'Fetching full job details from the vacancy site…'
                                : <JobSummaryContent text={summary} className="text-sm" />}
                        </div>
                        {summaryError && (
                            <p className="text-xs text-accent-warning mt-3">{summaryError}</p>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl font-semibold text-base hover:from-blue-600 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
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
        </div>
    )
}

export default JobDetailsPage
