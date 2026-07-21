import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import ResumeUploadDropzone from '../components/ai-resumer/ResumeUploadDropzone.jsx'
import { aiResumerService } from '../services/aiResumerService.js'

const AiResumerPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [checkingResumeState, setCheckingResumeState] = useState(true)
  const [latestProfile, setLatestProfile] = useState(null)
  const [latestJob, setLatestJob] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      setCheckingResumeState(false)
      setLatestProfile(null)
      setLatestJob(null)
      return
    }

    let mounted = true
    const resumeSession = async () => {
      try {
        const activeJob = await aiResumerService.getActiveProcessingJob(user.id)
        if (!mounted) return

        if (activeJob?.candidate_profile_id) {
          navigate('/ai-resumer/results', {
            replace: true,
            state: { candidateProfileId: activeJob.candidate_profile_id },
          })
          return
        }

        const profile = await aiResumerService.getLatestCandidateProfile(user.id)
        if (!mounted) return
        setLatestProfile(profile)

        if (profile?.id) {
          const job = await aiResumerService.getLatestProcessingJobForProfile(user.id, profile.id)
          if (!mounted) return
          setLatestJob(job)
        } else {
          setLatestJob(null)
        }
      } catch (error) {
        console.error('AiResumerPage resume check failed', error)
      } finally {
        if (mounted) {
          setCheckingResumeState(false)
        }
      }
    }

    resumeSession()
    return () => {
      mounted = false
    }
  }, [navigate, user?.id])

  const latestJobIsZeroResults = latestJob?.status === 'completed' && Number(latestJob?.result_count || 0) === 0
  const latestJobHasMatches = latestJob?.status === 'completed' && Number(latestJob?.result_count || 0) > 0
  const latestJobFailed = latestJob?.status === 'failed'

  if (checkingResumeState) {
    return (
      <div className="screen active">
        <div className="header flex items-center justify-between">
          <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-lg font-bold text-text-primary">AI Resumer</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-text-secondary">Checking your latest AI Resumer progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active">
      <div className="header flex items-center justify-between">
        <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-lg font-bold text-text-primary">AI Resumer</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          {latestProfile?.id && latestJob && (
            <div className="rounded-2xl border border-glass-border bg-bg-secondary/40 p-4 space-y-3">
              <h2 className="text-base font-semibold text-text-primary">Latest AI Resumer report</h2>
              <p className="text-sm text-text-secondary">
                {latestJobHasMatches
                  ? `${latestJob.result_count} matches are ready to review.`
                  : latestJobIsZeroResults
                    ? 'The last run found no matches. Try broadening the search or editing your profile.'
                    : latestJobFailed
                      ? (latestJob.error || 'The previous matching attempt failed.')
                      : (latestJob.stage_message || 'Your report is currently processing.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/ai-resumer/results', { state: { candidateProfileId: latestProfile.id } })}
                  className="rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View latest results
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ai-resumer/manual', { state: { candidateProfileId: latestProfile.id } })}
                  className="rounded-xl border border-accent-primary/40 px-4 py-2.5 text-sm font-semibold text-accent-primary hover:bg-accent-primary/10"
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLatestProfile(null)
                    setLatestJob(null)
                  }}
                  className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-primary/40"
                >
                  Start new search
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-glass-border bg-bg-secondary/40 p-4">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Build your candidate profile</h2>
            <p className="text-sm text-text-secondary mb-4">
              Upload your resume or fill your profile manually. We match your experience with live job listings.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ai-resumer/manual')}
              className="w-full rounded-xl border border-accent-primary/40 px-4 py-2.5 text-sm font-semibold text-accent-primary hover:bg-accent-primary/10"
            >
              Fill manually instead
            </button>
          </div>

          <ResumeUploadDropzone
            userId={user?.id}
            onCompleted={(candidateProfile) => {
              navigate('/ai-resumer/results', { state: { candidateProfileId: candidateProfile.id } })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default AiResumerPage
