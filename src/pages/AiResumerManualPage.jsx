import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import ManualProfileForm from '../components/ai-resumer/ManualProfileForm.jsx'
import { aiResumerService } from '../services/aiResumerService.js'

const AiResumerManualPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const editingProfileId = location.state?.candidateProfileId || null
  const [saving, setSaving] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(Boolean(editingProfileId))
  const [initialData, setInitialData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editingProfileId) {
      setLoadingProfile(false)
      return
    }

    let mounted = true
    const loadProfile = async () => {
      setLoadingProfile(true)
      try {
        const profile = await aiResumerService.getCandidateProfileById(editingProfileId)
        if (!mounted) return
        if (!profile) {
          throw new Error('Candidate profile not found')
        }
        setInitialData({
          age: profile.age,
          skills: profile.skills || [],
          education: profile.education || [],
          workExperience: profile.work_experience || [],
          internships: profile.internships || [],
          achievements: profile.achievements || [],
          swipyStartupId: profile.swipy_startup_id || null,
        })
      } catch (loadError) {
        if (!mounted) return
        setError(loadError.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoadingProfile(false)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [editingProfileId])

  const handleSubmit = async (payload) => {
    if (!user?.id) return
    setSaving(true)
    setError('')
    try {
      let candidateProfile = null
      if (editingProfileId) {
        candidateProfile = await aiResumerService.updateCandidateProfile(editingProfileId, {
          age: payload.age,
          education: payload.education,
          skills: payload.skills,
          workExperience: payload.workExperience,
          internships: payload.internships,
          achievements: payload.achievements,
          swipyStartupId: payload.swipyStartupId,
        })
      } else {
        const resume = await aiResumerService.createResume({
          userId: user.id,
          source: 'manual',
          fileUrl: null,
          rawText: null,
        })

        candidateProfile = await aiResumerService.createCandidateProfile({
          userId: user.id,
          resumeId: resume.id,
          age: payload.age,
          education: payload.education,
          skills: payload.skills,
          workExperience: payload.workExperience,
          internships: payload.internships,
          achievements: payload.achievements,
          swipyStartupId: payload.swipyStartupId,
        })
      }

      navigate('/ai-resumer/results', { state: { candidateProfileId: candidateProfile.id } })
    } catch (e) {
      setError(e.message || 'Failed to save manual profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen active">
      <div className="header flex items-center justify-between">
        <button className="header-btn" onClick={() => navigate('/ai-resumer')} aria-label="Back">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-lg font-bold text-text-primary">Manual Profile</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          <div className="rounded-2xl border border-glass-border bg-bg-secondary/40 p-4">
            <h2 className="text-base font-semibold text-text-primary mb-1">
              {editingProfileId ? 'Edit your profile' : 'Complete your profile'}
            </h2>
            <p className="text-sm text-text-secondary">
              Add your skills, education, and experience to start AI matching.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {loadingProfile ? (
            <div className="rounded-xl border border-glass-border bg-bg-secondary/40 px-3 py-6 text-center text-sm text-text-secondary">
              Loading your profile...
            </div>
          ) : (
            <ManualProfileForm
              key={editingProfileId || 'new-profile'}
              userId={user?.id}
              initialData={initialData}
              onSubmit={handleSubmit}
              submitting={saving}
              submitLabel={editingProfileId ? 'Save changes and find matches' : 'Save and find matches'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AiResumerManualPage
