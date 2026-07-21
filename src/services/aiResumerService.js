import { supabase } from './supabaseClient.js'

const AI_JOBS_BASE = (import.meta.env.VITE_AI_JOBS_API_URL || '').replace(/\/$/, '')
const ACTIVE_JOB_STATUSES = ['queued', 'parsing', 'matching']
const JOB_STALE_MS = 2 * 60 * 1000

const ENDPOINTS = {
  parseResume: `${AI_JOBS_BASE}/api/resume/parse`,
  attachStartup: `${AI_JOBS_BASE}/api/resume/attach-startup`,
  matchJobs: `${AI_JOBS_BASE}/api/jobs/match`,
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`)
  }
  return payload
}

function getJobUpdatedAtMs(job) {
  const updatedAt = job?.updated_at || job?.created_at
  const parsed = updatedAt ? new Date(updatedAt).getTime() : Number.NaN
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function isFreshActiveJob(job) {
  if (!job || !ACTIVE_JOB_STATUSES.includes(job.status)) return false
  const updatedAtMs = getJobUpdatedAtMs(job)
  if (!Number.isFinite(updatedAtMs)) return false
  return Date.now() - updatedAtMs <= JOB_STALE_MS
}

export const aiResumerService = {
  async parseResume(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(ENDPOINTS.parseResume, {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || `Resume parse failed (${response.status})`)
    }
    return payload
  },

  async uploadResumeFile(userId, file) {
    const ext = (file.name?.split('.').pop() || 'bin').toLowerCase()
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(error.message || 'Failed to upload resume file')
    }

    return data.path
  },

  async createResume({ userId, source, fileUrl = null, rawText = null }) {
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        source,
        file_url: fileUrl,
        raw_text: rawText,
      })
      .select()
      .single()

    if (error) throw new Error(error.message || 'Failed to create resume')
    return data
  },

  async createCandidateProfile({
    userId,
    resumeId = null,
    age = null,
    education = [],
    skills = [],
    workExperience = [],
    internships = [],
    achievements = [],
    swipyStartupId = null,
  }) {
    const { data, error } = await supabase
      .from('candidate_profiles')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        age,
        education,
        skills,
        work_experience: workExperience,
        internships,
        achievements,
        swipy_startup_id: swipyStartupId,
      })
      .select()
      .single()

    if (error) throw new Error(error.message || 'Failed to create candidate profile')
    return data
  },

  async updateCandidateProfile(profileId, {
    age = null,
    education = [],
    skills = [],
    workExperience = [],
    internships = [],
    achievements = [],
    swipyStartupId = null,
  }) {
    const { data, error } = await supabase
      .from('candidate_profiles')
      .update({
        age,
        education,
        skills,
        work_experience: workExperience,
        internships,
        achievements,
        swipy_startup_id: swipyStartupId,
      })
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw new Error(error.message || 'Failed to update candidate profile')
    return data
  },

  async getLatestCandidateProfile(userId) {
    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch candidate profile')
    }
    return data || null
  },

  async getLatestProcessingJob(userId, candidateProfileId = null) {
    let query = supabase
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (candidateProfileId) {
      query = query.eq('candidate_profile_id', candidateProfileId)
    }

    const { data, error } = await query.maybeSingle()
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch processing job')
    }
    return data || null
  },

  async getActiveProcessingJob(userId) {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .not('status', 'in', '(completed,failed)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch active processing job')
    }
    if (!data || !isFreshActiveJob(data)) return null
    return data
  },

  async getLatestProcessingJobForProfile(userId, candidateProfileId) {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('candidate_profile_id', candidateProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch processing job')
    }
    return data || null
  },

  async getProcessingJobById(jobId) {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch processing job')
    }
    return data || null
  },

  async getCandidateProfileById(profileId) {
    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to fetch candidate profile')
    }
    return data || null
  },

  async startJobMatch(candidateProfileId) {
    return postJson(ENDPOINTS.matchJobs, { candidate_profile_id: candidateProfileId })
  },

  async attachStartupAsExperience(userId, startupId) {
    return postJson(ENDPOINTS.attachStartup, { user_id: userId, startup_id: startupId })
  },

  async getJobMatches(candidateProfileId) {
    const { data, error } = await supabase
      .from('job_matches')
      .select('*')
      .eq('candidate_profile_id', candidateProfileId)
      .order('rank', { ascending: true })

    if (error) throw new Error(error.message || 'Failed to fetch job matches')
    return data || []
  },

  subscribeToProcessingJob(jobId, callback) {
    const channel = supabase
      .channel(`job-status-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          callback(payload.new)
        },
      )
      .subscribe()

    return channel
  },

  removeChannel(channel) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  },

  isFreshActiveJob,
  isActiveStatus(status) {
    return ACTIVE_JOB_STATUSES.includes(status)
  },
}
