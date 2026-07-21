import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { aiResumerService } from '../services/aiResumerService.js'
import MatchingProgress from '../components/ai-resumer/MatchingProgress.jsx'
import MatchResultsGrid from '../components/ai-resumer/MatchResultsGrid.jsx'
import { useAiResumerStatus } from '../context/AiResumerStatusContext.jsx'

const ACTIVE_STATUSES = ['queued', 'parsing', 'matching']

const AiResumerResultsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { setActiveJob, showToast } = useAiResumerStatus()

  const [candidateProfileId, setCandidateProfileId] = useState(location.state?.candidateProfileId || null)
  const [jobStatus, setJobStatus] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const channelRef = useRef(null)
  const pollingRef = useRef(null)

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      aiResumerService.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const loadMatches = useCallback(async (profileId) => {
    const data = await aiResumerService.getJobMatches(profileId)
    setMatches(data)
  }, [])

  const handleJobUpdate = useCallback(async (updated, profileId) => {
    if (!updated) return
    setJobStatus(updated)

    if (updated.status === 'completed') {
      cleanupChannel()
      stopPolling()
      await loadMatches(profileId)
      setActiveJob(null)
      setError('')
      return
    }

    if (updated.status === 'failed') {
      cleanupChannel()
      stopPolling()
      setError(updated.error || 'Matching failed')
      setActiveJob(null)
      return
    }

    setError('')
    setActiveJob(updated)
  }, [cleanupChannel, loadMatches, setActiveJob, stopPolling])

  const reconcileJobStatus = useCallback(async (jobId, profileId) => {
    const latest = await aiResumerService.getProcessingJobById(jobId)
    if (latest) {
      await handleJobUpdate(latest, profileId)
    }
    return latest
  }, [handleJobUpdate])

  const startPolling = useCallback((jobId, profileId) => {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      try {
        await reconcileJobStatus(jobId, profileId)
      } catch (pollError) {
        console.error('AiResumerResultsPage polling error', pollError)
      }
    }, 3500)
  }, [reconcileJobStatus, stopPolling])

  const subscribeToJob = useCallback(async (jobId, profileId) => {
    cleanupChannel()
    stopPolling()
    channelRef.current = aiResumerService.subscribeToProcessingJob(jobId, async (updated) => {
      await handleJobUpdate(updated, profileId)
    })
    const latest = await reconcileJobStatus(jobId, profileId)
    if (latest && ACTIVE_STATUSES.includes(latest.status)) {
      startPolling(jobId, profileId)
    }
  }, [cleanupChannel, handleJobUpdate, reconcileJobStatus, startPolling, stopPolling])

  const startMatchJob = useCallback(async (profileId) => {
    setError('')
    const start = await aiResumerService.startJobMatch(profileId)
    const job = await aiResumerService.getProcessingJobById(start.job_id)
    if (job) {
      setJobStatus(job)
      setActiveJob(job)
      await subscribeToJob(job.id, profileId)
    }
  }, [setActiveJob, subscribeToJob])

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    const init = async () => {
      setLoading(true)
      setError('')
      try {
        let profileId = candidateProfileId
        if (!profileId) {
          const latestProfile = await aiResumerService.getLatestCandidateProfile(user.id)
          profileId = latestProfile?.id || null
        }

        if (!profileId) {
          throw new Error('No candidate profile found. Please upload a resume or fill the form first.')
        }

        if (!mounted) return
        setCandidateProfileId(profileId)

        const latestJob = await aiResumerService.getLatestProcessingJob(user.id, profileId)

        if (latestJob && aiResumerService.isActiveStatus(latestJob.status)) {
          if (aiResumerService.isFreshActiveJob(latestJob)) {
            setJobStatus(latestJob)
            setActiveJob(latestJob)
            await subscribeToJob(latestJob.id, profileId)
          } else {
            setJobStatus({
              ...latestJob,
              status: 'failed',
              error: 'This matching run expired. Please start a new one.',
              stage_message: 'Expired',
            })
            setError('This matching run expired. Please start a new one.')
            setActiveJob(null)
          }
        } else if (latestJob?.status === 'completed') {
          setJobStatus(latestJob)
          await loadMatches(profileId)
          setActiveJob(null)
        } else if (latestJob?.status === 'failed') {
          setJobStatus(latestJob)
          setError(latestJob.error || 'Matching failed')
          setActiveJob(null)
        } else {
          await startMatchJob(profileId)
        }
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load results')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
      cleanupChannel()
      stopPolling()
    }
  }, [user?.id, candidateProfileId, cleanupChannel, loadMatches, setActiveJob, startMatchJob, stopPolling, subscribeToJob])

  if (loading) {
    return (
      <div className="screen active">
        <div className="header flex items-center justify-between">
          <button className="header-btn" onClick={() => navigate('/ai-resumer')} aria-label="Back">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-lg font-bold text-text-primary">AI Resumer Results</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 p-4">
          <div className="rounded-2xl border border-glass-border bg-bg-secondary/40 p-6 text-center text-text-secondary">
            Loading report status...
          </div>
        </div>
      </div>
    )
  }

  const status = jobStatus?.status
  const showProgress = ACTIVE_STATUSES.includes(status)

  return (
    <div className="screen active">
      <div className="header flex items-center justify-between">
        <button className="header-btn" onClick={() => navigate('/ai-resumer')} aria-label="Back">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-lg font-bold text-text-primary">AI Resumer Results</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          {showProgress && (
            <MatchingProgress status={status} stageMessage={jobStatus?.stage_message} />
          )}

          {!showProgress && error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
              <p className="text-sm text-red-300 mb-3">{error}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => startMatchJob(candidateProfileId)}
                  className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ai-resumer/manual', { state: { candidateProfileId } })}
                  className="rounded-xl border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/10"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ai-resumer')}
                  className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-primary/40"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {!showProgress && !error && (
            <MatchResultsGrid
              matches={matches}
              onRetrySearch={() => startMatchJob(candidateProfileId)}
              onEditProfile={() => navigate('/ai-resumer/manual', { state: { candidateProfileId } })}
              onStartOver={() => navigate('/ai-resumer')}
              onSeeAll={() => {
                showToast({
                  type: 'success',
                  message: 'Subscription coming soon',
                })
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AiResumerResultsPage
