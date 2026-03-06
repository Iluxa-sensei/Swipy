import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStarredJobs, removeStarredJob } from '../services/starredJobsService'
import { useAuth } from '../hooks'

const DesktopStarredJobsPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [jobs, setJobs] = useState([])

    const refresh = useCallback(async () => {
        if (!user?.id) {
            setJobs([])
            return
        }
        const data = await getStarredJobs(user.id)
        setJobs(data)
    }, [user?.id])

    useEffect(() => {
        let isMounted = true
        const load = async () => {
            await refresh()
            if (!isMounted) return
        }
        load()
        return () => {
            isMounted = false
        }
    }, [refresh])

    const handleUnstar = async (jobId, e) => {
        e?.stopPropagation()
        if (!user?.id) {
            console.warn('handleUnstar: user not available')
            return
        }
        await removeStarredJob(user.id, jobId)
        setJobs((prev) => prev.filter((job) => job.id !== jobId))
    }

    const openJob = (job) => {
        navigate(`/jobs/${job.id}`, { state: { job } })
    }

    return (
        <div className="desktop-page" style={{ overflow: 'visible' }}>
            <div className="desktop-page-section">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-semibold text-text-primary">Starred Jobs</h1>
                    <button
                        type="button"
                        onClick={() => navigate('/jobs')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg text-text-primary text-sm font-medium hover:bg-glass-border transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                        Back to Search
                    </button>
                </div>

                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-accent-primary/80 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="far fa-star text-4xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">No starred jobs yet</h2>
                        <p className="text-text-secondary mb-6 max-w-md text-center">
                            Star jobs from the Job Scanner to save them here. You can open them anytime.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/jobs')}
                            className="px-6 py-3 rounded-xl bg-accent-primary text-white font-semibold hover:opacity-90"
                        >
                            Go to Job Scanner
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-glass-border overflow-hidden bg-bg-secondary/30">
                        <div className="jobs-table-header grid grid-cols-[auto_1fr_1fr_1fr_2fr_auto] gap-4 px-5 py-3 border-b border-glass-border bg-bg-secondary/50 text-text-secondary text-xs font-semibold uppercase tracking-wider">
                            <div className="w-8"></div>
                            <div>Company</div>
                            <div>Role</div>
                            <div>Location</div>
                            <div>Summary</div>
                            <div className="w-24"></div>
                        </div>
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => openJob(job)}
                                className="grid grid-cols-[auto_1fr_1fr_1fr_2fr_auto] gap-4 px-5 py-4 border-b border-glass-border/50 last:border-b-0 hover:bg-glass-bg/50 transition-colors cursor-pointer items-center jobs-table-row min-w-0"
                            >
                                <button
                                    type="button"
                                    onClick={(e) => handleUnstar(job.id, e)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-accent-warning hover:opacity-80"
                                    aria-label="Remove from starred"
                                >
                                    <i className="fas fa-star"></i>
                                </button>
                                <div className="min-w-0">
                                    <span className="text-text-primary font-medium truncate block">{job.company}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-text-primary font-medium truncate block">{job.title}</span>
                                    {job.salary && <span className="text-accent-primary text-xs mt-0.5 block">{job.salary}</span>}
                                </div>
                                <div className="min-w-0 text-text-secondary text-sm truncate">{job.location}</div>
                                <div className="min-w-0">
                                    <p className="text-text-secondary text-sm line-clamp-2">{job.shortDescription}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openJob(job)
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
            </div>
        </div>
    )
}

export default DesktopStarredJobsPage
