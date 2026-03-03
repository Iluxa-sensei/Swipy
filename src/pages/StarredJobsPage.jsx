import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStarredJobs, removeStarredJob } from '../services/starredJobsService'

const StarredJobsPage = () => {
    const navigate = useNavigate()
    const [jobs, setJobs] = useState(getStarredJobs())

    const refresh = () => setJobs(getStarredJobs())

    const handleUnstar = (jobId, e) => {
        e?.stopPropagation()
        removeStarredJob(jobId)
        refresh()
    }

    const openJob = (job) => {
        navigate(`/jobs/${job.id}`, { state: { job } })
    }

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate('/jobs')} aria-label="Back">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-lg font-bold text-text-primary">Starred Jobs</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="p-4 space-y-4">
                    {jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-accent-primary/80 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <i className="far fa-star text-2xl text-white"></i>
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-3">No starred jobs yet</h2>
                            <p className="text-text-secondary text-sm max-w-xs text-center mb-6">
                                Star jobs from the Job Scanner to save them here.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/jobs')}
                                className="px-5 py-3 rounded-xl bg-accent-primary text-white font-semibold text-sm"
                            >
                                Go to Job Scanner
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-glass-border overflow-hidden bg-bg-secondary/30">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => openJob(job)}
                                    className="flex flex-col gap-3 p-4 border-b border-glass-border/50 last:border-b-0 active:bg-glass-bg/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => handleUnstar(job.id, e)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-accent-warning flex-shrink-0 mt-0.5"
                                            aria-label="Remove from starred"
                                        >
                                            <i className="fas fa-star"></i>
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
                                                openJob(job)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-accent-primary text-accent-primary font-semibold text-xs flex-shrink-0"
                                        >
                                            <i className="fas fa-external-link-alt text-[10px]"></i>
                                            View
                                        </button>
                                    </div>
                                    <p className="text-text-secondary text-xs line-clamp-2 pl-11">{job.shortDescription}</p>
                                    <p className="text-text-secondary text-xs pl-11 flex items-center gap-1">
                                        <i className="fas fa-location-dot text-[10px]"></i>
                                        {job.location}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StarredJobsPage
