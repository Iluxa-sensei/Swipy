/**
 * AI-assisted job search server.
 * Uses OpenAI to interpret the user's query and Adzuna API to fetch jobs.
 * Run: npm run ai-server (with .env containing VITE_GPT_API_KEY, VITE_ADZUNA_APP_ID, VITE_ADZUNA_APP_KEY)
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env' })

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

const ADZUNA_APP_ID = process.env.VITE_ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.VITE_ADZUNA_APP_KEY
const ADZUNA_DEFAULT_COUNTRY = process.env.ADZUNA_COUNTRY || 'gb'
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api'
const OPENAI_API_KEY = process.env.VITE_GPT_API_KEY || process.env.OPENAI_API_KEY
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY
const SCRAPINGBEE_BASE_URL = 'https://app.scrapingbee.com/api/v1'
const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

const GRADIENTS = [
  'bg-gradient-to-br from-blue-400 to-cyan-600',
  'bg-gradient-to-br from-purple-400 to-pink-500',
  'bg-gradient-to-br from-green-400 to-emerald-600',
  'bg-gradient-to-br from-amber-400 to-orange-600',
  'bg-gradient-to-br from-indigo-400 to-violet-600',
  'bg-gradient-to-br from-teal-400 to-cyan-600',
  'bg-gradient-to-br from-red-400 to-rose-600',
  'bg-gradient-to-br from-sky-400 to-blue-600',
  'bg-gradient-to-br from-lime-400 to-green-600',
  'bg-gradient-to-br from-fuchsia-400 to-purple-700',
]

const MATCH_TIMEOUT_MS = 60_000
const STALE_JOB_MS = MATCH_TIMEOUT_MS * 2
const ACTIVE_JOB_STATUSES = ['queued', 'parsing', 'matching']
const ADZUNA_TRANSIENT_STATUS_CODES = new Set([429, 502, 503, 504])
const MAX_ADZUNA_RETRIES = 3
const TARGET_MATCHES = 15
const TECH_SKILL_PATTERN = /(python|javascript|typescript|react|node|java|go|rust|swift|kotlin|sql|postgres|aws|azure|gcp|ml|ai|data|backend|frontend|full[-\s]?stack|cyber|security|devops|docker|kubernetes)/i

function buildAdzunaParams(intent, query) {
  const keywords = (intent.keywords || query.trim()).trim() || query.trim()
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: String(intent.results_per_page || 6),
    what: keywords,
    'content-type': 'application/json',
  })
  if (intent.location) params.set('where', intent.location)
  if (intent.salary_min) params.set('salary_min', String(intent.salary_min))
  if (intent.employment_type === 'full_time') params.set('full_time', '1')
  if (intent.employment_type === 'part_time') params.set('part_time', '1')
  if (intent.contract_type === 'permanent') params.set('permanent', '1')
  if (intent.contract_type === 'contract') params.set('contract', '1')
  if (intent.exclude_keywords?.length) params.set('what_exclude', intent.exclude_keywords.join(' '))
  if (intent.sort_by) params.set('sort_by', intent.sort_by)
  return params
}

function formatSalary(min, max) {
  if (!min && !max) return null
  const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min || max)
}

function formatPostedDate(created) {
  if (!created) return null
  const days = Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (days < 30) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

function formatContractType(contractType, contractTime) {
  const parts = []
  if (contractTime) parts.push(contractTime.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
  if (contractType) parts.push(contractType.replace(/\b\w/g, (c) => c.toUpperCase()))
  return parts.join(' · ') || null
}

function inferSeniority(title = '') {
  const t = title.toLowerCase()
  if (t.includes('principal') || t.includes('lead') || t.includes('head of') || t.includes('senior')) return 'Senior'
  if (t.includes('mid-level') || t.includes('mid level') || t.includes('intermediate')) return 'Mid-level'
  if (t.includes('junior') || t.includes('graduate') || t.includes('entry-level') || t.includes('entry level')) return 'Junior'
  return null
}

function normalizeJob(result, index) {
  return {
    id: String(result.id),
    title: result.title || 'Untitled Position',
    company: result.company?.display_name || 'Company not specified',
    location: result.location?.display_name || 'Location not specified',
    type: formatContractType(result.contract_type, result.contract_time),
    experience: inferSeniority(result.title || ''),
    shortDescription: result.description || '',
    fullDescription: result.description || 'No description available.',
    salary: formatSalary(result.salary_min, result.salary_max),
    tags: result.category ? [result.category.tag] : [],
    gradient: GRADIENTS[index % GRADIENTS.length],
    postedDate: formatPostedDate(result.created),
    urlPlaceholder: result.redirect_url || '#',
  }
}

function ensureJson(value, fallback) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeArray(value) {
  const parsed = ensureJson(value, value)
  if (Array.isArray(parsed)) return parsed
  return []
}

function buildWorkSummary(workExperience = []) {
  return workExperience.map((item) => {
    const title = item?.title || 'Role'
    const company = item?.company || 'Company'
    const period = [item?.start, item?.end].filter(Boolean).join(' - ')
    return `${title} at ${company}${period ? ` (${period})` : ''}`
  }).join('; ')
}

function normalizeQueryTerm(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function isLikelyEducationOnlyTerm(value = '') {
  const normalized = normalizeQueryTerm(value).toLowerCase()
  if (!normalized) return true
  if (/^\d{1,2}(st|nd|rd|th)?\s*(class|grade)$/.test(normalized)) return true
  if (normalized.includes('high school')) return true
  if (normalized.includes('class')) return true
  return false
}

function buildJobQueriesFromProfile(profile) {
  const skills = Array.isArray(profile.skills) ? profile.skills.slice(0, 8) : []
  const experiences = normalizeArray(profile.work_experience)
  const internships = normalizeArray(profile.internships)
  const education = normalizeArray(profile.education)

  const workTitles = experiences.map((exp) => normalizeQueryTerm(exp?.title)).filter(Boolean).slice(0, 2)
  const internshipTitles = internships.map((item) => normalizeQueryTerm(item?.title)).filter(Boolean).slice(0, 2)
  const educationHints = education
    .flatMap((item) => [normalizeQueryTerm(item?.field), normalizeQueryTerm(item?.degree)])
    .filter((item) => item && !isLikelyEducationOnlyTerm(item))
    .slice(0, 2)
  const technicalSkills = skills
    .map((skill) => normalizeQueryTerm(skill))
    .filter((skill) => skill && TECH_SKILL_PATTERN.test(skill))
    .slice(0, 3)

  const roleHints = workTitles.length > 0 ? workTitles : internshipTitles
  const roleQuery = roleHints.slice(0, 2).join(' ')
  const skillQuery = technicalSkills.slice(0, 3).join(' ')
  const educationQuery = educationHints.slice(0, 2).join(' ')

  const uniqueQueries = [...new Set([
    roleQuery,
    [roleQuery, skillQuery].filter(Boolean).join(' '),
    [skillQuery, educationQuery].filter(Boolean).join(' '),
    skillQuery ? `${technicalSkills[0]} developer` : '',
    'software developer',
  ].map((query) => normalizeQueryTerm(query)).filter(Boolean))]

  return uniqueQueries.slice(0, 5)
}

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Matching timed out after ${ms / 1000}s`)), ms)
  })
}

function safeErrorMessage(error) {
  if (!error) return 'Unknown error'
  const rawMessage = typeof error === 'string' ? error : error.message || 'Unknown error'
  if (rawMessage.startsWith('Adzuna error 429')) return 'Job provider is rate limiting requests. Please try again in a few minutes.'
  if (rawMessage.startsWith('Adzuna error 503')) return 'Job provider is temporarily unavailable. Please retry shortly.'
  if (rawMessage.startsWith('Adzuna error 502') || rawMessage.startsWith('Adzuna error 504')) {
    return 'Job provider timeout. Please retry shortly.'
  }
  return rawMessage.slice(0, 500)
}

async function updateProcessingJob(jobId, payload) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin
    .from('processing_jobs')
    .update(payload)
    .eq('id', jobId)
  if (error) {
    console.error('Failed to update processing job', jobId, error.message)
  }
}

async function failProcessingJob(jobId, errorMessage) {
  await updateProcessingJob(jobId, {
    status: 'failed',
    error: String(errorMessage || 'Job matching failed'),
  })
}

function isActiveJobStatus(status) {
  return ACTIVE_JOB_STATUSES.includes(status)
}

function getJobUpdatedAtMs(job) {
  const value = job?.updated_at || job?.created_at
  const parsed = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function isStaleJob(job) {
  if (!job || !isActiveJobStatus(job.status)) return false
  const updatedAtMs = getJobUpdatedAtMs(job)
  if (!Number.isFinite(updatedAtMs)) return true
  return Date.now() - updatedAtMs > STALE_JOB_MS
}

async function expireStaleJobsForProfile(candidateProfileId) {
  const { data: activeJobs, error } = await supabaseAdmin
    .from('processing_jobs')
    .select('*')
    .eq('candidate_profile_id', candidateProfileId)
    .in('status', ACTIVE_JOB_STATUSES)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(`Failed to inspect active jobs: ${error.message}`)
  }

  for (const job of activeJobs || []) {
    if (isStaleJob(job)) {
      await failProcessingJob(job.id, 'This matching job expired. Please try again.')
    }
  }
}

async function getFreshActiveJobForProfile(candidateProfileId) {
  const { data: activeJobs, error } = await supabaseAdmin
    .from('processing_jobs')
    .select('*')
    .eq('candidate_profile_id', candidateProfileId)
    .in('status', ACTIVE_JOB_STATUSES)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(`Failed to inspect active jobs: ${error.message}`)
  }

  const fresh = (activeJobs || []).find((job) => !isStaleJob(job))
  return fresh || null
}

async function fetchCandidateContext(candidateProfileId) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('candidate_profiles')
    .select('*')
    .eq('id', candidateProfileId)
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'Candidate profile not found')
  }

  let resume = null
  if (profile.resume_id) {
    const { data: resumeData } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', profile.resume_id)
      .single()
    resume = resumeData
  }

  let startup = null
  if (profile.swipy_startup_id) {
    const { data: startupData } = await supabaseAdmin
      .from('startups')
      .select('id, name, industry, stage, description, website, location')
      .eq('id', profile.swipy_startup_id)
      .single()
    startup = startupData
  }

  return { profile, resume, startup }
}

async function fetchAdzunaMatches(query, resultsPerPage = 12, onRetry = null) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('Adzuna credentials are not configured')
  }

  const intent = {
    keywords: query,
    location: null,
    salary_min: null,
    employment_type: 'any',
    contract_type: 'any',
    exclude_keywords: [],
    sort_by: 'date',
    results_per_page: resultsPerPage,
  }

  const params = buildAdzunaParams(intent, query)
  const url = `${ADZUNA_BASE_URL}/jobs/${ADZUNA_DEFAULT_COUNTRY}/search/1?${params.toString()}`

  for (let attempt = 0; attempt <= MAX_ADZUNA_RETRIES; attempt += 1) {
    const adzunaRes = await fetch(url)
    if (adzunaRes.ok) {
      const data = await adzunaRes.json()
      return (data.results || []).map((item, index) => normalizeJob(item, index))
    }

    const status = adzunaRes.status
    const retryAfterHeader = Number(adzunaRes.headers.get('retry-after') || 0)
    const shouldRetry = ADZUNA_TRANSIENT_STATUS_CODES.has(status) && attempt < MAX_ADZUNA_RETRIES
    if (!shouldRetry) {
      throw new Error(`Adzuna error ${status}`)
    }

    const retryAfterMs = retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : Math.min(4000 * (attempt + 1), 10_000)
    if (typeof onRetry === 'function') {
      await onRetry({ query, status, retryAfterMs, attempt: attempt + 1 })
    }
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
  }

  throw new Error('Adzuna error 503')
}

async function collectAdzunaMatches(queries, targetCount, updateStage) {
  const collected = []
  const seen = new Set()

  for (const query of queries) {
    await updateStage(`Searching jobs for "${query}"...`)
    const batch = await fetchAdzunaMatches(
      query,
      targetCount,
      async ({ status, retryAfterMs }) => {
        await updateStage(`Provider busy (${status}). Retrying in ${Math.ceil(retryAfterMs / 1000)}s...`)
      },
    )
    for (const listing of batch) {
      if (!seen.has(listing.id)) {
        seen.add(listing.id)
        collected.push(listing)
      }
    }
    if (collected.length >= targetCount) {
      break
    }
  }

  return collected.slice(0, targetCount)
}

async function scoreSingleMatch(candidateProfile, listing) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          "You are a job-matching analyst for Swipy. Given a candidate profile and a job description, output strict JSON with: match_score (0-100), why_match (2 sentences max), rewritten_bullets (array of 2-3 strings rewriting the candidate's most relevant experience — use startup experience if source is 'swipy_startup' — to align with the job's language), skill_gaps (array of {gap, suggestion}). Be honest — do not inflate match_score for poor fits.",
      },
      {
        role: 'user',
        content:
          `CANDIDATE PROFILE: ${JSON.stringify(candidateProfile)}\n` +
          `JOB DESCRIPTION: ${JSON.stringify(listing)}\n` +
          'Return only valid JSON matching the schema above.',
      },
    ],
  })

  const parsed = ensureJson(completion.choices[0]?.message?.content, {})
  return {
    match_score: Number.isFinite(parsed.match_score) ? Math.max(0, Math.min(100, Math.round(parsed.match_score))) : 0,
    why_match: typeof parsed.why_match === 'string' ? parsed.why_match : '',
    rewritten_bullets: normalizeArray(parsed.rewritten_bullets),
    skill_gaps: normalizeArray(parsed.skill_gaps),
  }
}

async function scoreListingsInBatches(candidateProfile, listings, batchSize = 5) {
  const scored = []
  for (let i = 0; i < listings.length; i += batchSize) {
    const batch = listings.slice(i, i + batchSize)
    const batchScores = await Promise.all(
      batch.map(async (listing) => {
        const score = await scoreSingleMatch(candidateProfile, listing)
        return { listing, ...score }
      }),
    )
    scored.push(...batchScores)
  }
  return scored
}

async function runMatchPipeline(jobId, candidateProfileId) {
  try {
    await Promise.race([
      (async () => {
        await updateProcessingJob(jobId, { status: 'parsing', stage_message: 'Reading your profile...', error: null })

        const { profile, resume, startup } = await fetchCandidateContext(candidateProfileId)

        await updateProcessingJob(jobId, { status: 'matching', stage_message: 'Preparing job search queries...' })

        const listingQueries = buildJobQueriesFromProfile(profile)
        const listings = await collectAdzunaMatches(
          listingQueries,
          TARGET_MATCHES,
          async (stageMessage) => updateProcessingJob(jobId, { stage_message: stageMessage }),
        )
        await updateProcessingJob(jobId, { stage_message: `Scoring ${listings.length} matches with AI...` })

        if (!openai) {
          throw new Error('OpenAI API key is not configured')
        }

        const candidatePayload = {
          age: profile.age,
          skills: profile.skills || [],
          education: normalizeArray(profile.education),
          work_experience: normalizeArray(profile.work_experience),
          internships: normalizeArray(profile.internships),
          achievements: normalizeArray(profile.achievements),
          resume_text: resume?.raw_text || '',
          startup,
          profile_summary: buildWorkSummary(normalizeArray(profile.work_experience)),
        }

        const scored = listings.length > 0 ? await scoreListingsInBatches(candidatePayload, listings, 5) : []
        const ranked = scored
          .sort((a, b) => b.match_score - a.match_score)
          .map((item, index) => ({ ...item, rank: index + 1 }))

        await supabaseAdmin
          .from('job_matches')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('candidate_profile_id', candidateProfileId)

        const rows = ranked.map((item) => ({
          user_id: profile.user_id,
          candidate_profile_id: candidateProfileId,
          job_title: item.listing.title,
          company: item.listing.company,
          job_source: 'adzuna',
          apply_url: item.listing.urlPlaceholder,
          match_score: item.match_score,
          why_match: item.why_match,
          rewritten_bullets: item.rewritten_bullets,
          skill_gaps: item.skill_gaps,
          rank: item.rank,
        }))

        await updateProcessingJob(jobId, { stage_message: 'Saving matches...' })

        if (rows.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('job_matches')
            .insert(rows)
          if (insertError) {
            throw new Error(`Failed to save job matches: ${insertError.message}`)
          }
        }

        await updateProcessingJob(jobId, {
          status: 'completed',
          result_count: rows.length,
          stage_message: rows.length > 0 ? 'Results ready' : 'No relevant jobs found yet',
          error: null,
        })
      })(),
      timeoutPromise(MATCH_TIMEOUT_MS),
    ])
  } catch (error) {
    console.error('Match pipeline failed:', error)
    await failProcessingJob(jobId, safeErrorMessage(error))
  }
}

app.post('/api/resume/parse', upload.single('file'), async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key is not configured on the server' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Resume file is required' })
  }

  try {
    const filename = req.file.originalname?.toLowerCase() || ''
    let extractedText = ''

    if (filename.endsWith('.pdf') || req.file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: req.file.buffer })
      try {
        const parsed = await parser.getText()
        extractedText = parsed.text || ''
      } finally {
        await parser.destroy()
      }
    } else if (
      filename.endsWith('.docx') ||
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer })
      extractedText = parsed.value || ''
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Upload PDF or DOCX.' })
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the uploaded file' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract candidate resume information and return strict JSON with keys: education, skills, work_experience, internships, achievements, age_if_mentioned. ' +
            'Return only valid JSON and never include markdown. Use empty arrays when not found. ' +
            'education is an array of objects with {school, degree, field, start, end}. ' +
            'work_experience is an array of objects with {title, company, start, end, description, source}. source should be "manual". Capture all full-time/part-time roles with concrete responsibilities, stack, ownership, and impact in description. ' +
            'internships is an array of objects with {title, company, start, end, description}. Include intern, trainee, apprenticeship, co-op, and fellowship roles here; do not mix them into work_experience. ' +
            'achievements is an array of objects with {title, organization, date, description}. Include awards, competition placements, medals, hackathons, notable projects, scholarships, and recognitions. Include scope and measurable outcome when present. ' +
            'For dates, keep raw month/year from the resume and normalize to compact strings (e.g. YYYY-MM, YYYY, or Present). ' +
            'Infer missing title/company/organization from nearby lines when clearly implied; do not leave obvious entries empty. ' +
            'skills is an array of unique strings. age_if_mentioned should be a number or null.',
        },
        {
          role: 'user',
          content: `RESUME TEXT:\n${extractedText.slice(0, 25_000)}\n\nReturn only valid JSON.`,
        },
      ],
    })

    const parsed = ensureJson(completion.choices[0]?.message?.content, {})
    return res.json({
      parsed: {
        education: normalizeArray(parsed.education),
        skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s) => typeof s === 'string') : [],
        work_experience: normalizeArray(parsed.work_experience).map((item) => ({
          ...item,
          source: 'manual',
        })),
        internships: normalizeArray(parsed.internships),
        achievements: normalizeArray(parsed.achievements),
        age_if_mentioned: Number.isFinite(parsed.age_if_mentioned) ? parsed.age_if_mentioned : null,
      },
      raw_text: extractedText,
    })
  } catch (error) {
    console.error('Resume parse error:', error)
    return res.status(500).json({ error: 'Resume parsing failed', message: safeErrorMessage(error) })
  }
})

app.post('/api/resume/attach-startup', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase service role is not configured on the server' })
  }

  const { user_id: userId, startup_id: startupId } = req.body || {}
  if (!userId || !startupId) {
    return res.status(400).json({ error: 'user_id and startup_id are required' })
  }

  try {
    const { data: startup, error } = await supabaseAdmin
      .from('startups')
      .select('id, owner_id, name, industry, stage, description, website, location')
      .eq('id', startupId)
      .single()

    if (error || !startup) {
      return res.status(404).json({ error: 'Startup not found' })
    }

    if (startup.owner_id !== userId) {
      return res.status(403).json({ error: 'You can only attach your own startup' })
    }

    const startupExperience = {
      title: 'Founder',
      company: startup.name || 'Swipy Startup',
      start: null,
      end: null,
      description: [
        startup.industry ? `Industry: ${startup.industry}` : null,
        startup.stage ? `Stage: ${startup.stage}` : null,
        startup.location ? `Location: ${startup.location}` : null,
        startup.description || null,
        startup.website ? `Website: ${startup.website}` : null,
      ].filter(Boolean).join('\n'),
      source: 'swipy_startup',
      startup_id: startup.id,
    }

    return res.json({ work_experience: startupExperience })
  } catch (e) {
    console.error('Attach startup error:', e)
    return res.status(500).json({ error: 'Failed to attach startup', message: safeErrorMessage(e) })
  }
})

app.post('/api/jobs/match', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase service role is not configured on the server' })
  }
  const { candidate_profile_id: candidateProfileId } = req.body || {}
  if (!candidateProfileId) {
    return res.status(400).json({ error: 'candidate_profile_id is required' })
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .select('id, user_id')
      .eq('id', candidateProfileId)
      .single()
    if (profileError || !profile) {
      return res.status(404).json({ error: 'Candidate profile not found' })
    }

    await expireStaleJobsForProfile(candidateProfileId)
    const freshExistingJob = await getFreshActiveJobForProfile(candidateProfileId)
    if (freshExistingJob) {
      return res.json({ job_id: freshExistingJob.id, resumed: true })
    }

    const { data: processingJob, error: createJobError } = await supabaseAdmin
      .from('processing_jobs')
      .insert({
        user_id: profile.user_id,
        candidate_profile_id: candidateProfileId,
        status: 'queued',
        stage_message: 'Queued',
      })
      .select()
      .single()

    if (createJobError || !processingJob) {
      if (createJobError?.code === '23505') {
        const existingActiveJob = await getFreshActiveJobForProfile(candidateProfileId)
        if (existingActiveJob) {
          return res.json({ job_id: existingActiveJob.id, resumed: true })
        }
      }
      throw new Error(createJobError?.message || 'Failed to create processing job')
    }

    void runMatchPipeline(processingJob.id, candidateProfileId)
    return res.json({ job_id: processingJob.id })
  } catch (error) {
    console.error('Jobs match endpoint error:', error)
    return res.status(500).json({ error: 'Failed to start matching job', message: safeErrorMessage(error) })
  }
})

app.post('/api/ai-job-search', async (req, res) => {
  const { query } = req.body || {}
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: 'Query is required' })
  }
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return res.status(503).json({
      error: 'Job search not configured',
      message: 'Add VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY to .env. Get keys at https://developer.adzuna.com/',
    })
  }
  const q = String(query).trim()

  try {
    let intent = { keywords: q, location: null, salary_min: null, employment_type: 'any', contract_type: 'any', exclude_keywords: [], sort_by: null, results_per_page: 6 }

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You convert natural language job search queries into Adzuna job search parameters. ' +
              'Users often make spelling mistakes (e.g. "snior develloper"); you MUST silently correct obvious typos in job titles, skills and locations before building the query. ' +
              'In such cases, set keywords to the corrected phrase (e.g. "senior developer") and location to the corrected place name. ' +
              'Return ONLY a single JSON object with these exact keys: keywords (string), location (string or null), country_code (string or null, e.g. gb, us), salary_min (number or null), ' +
              'employment_type (one of: full_time, part_time, any), contract_type (one of: permanent, contract, any), exclude_keywords (array of strings), sort_by (date or salary or null), results_per_page (number or null). ' +
              'Extract job titles, skills, and locations from the user text. If unclear, use null or "any".',
          },
          { role: 'user', content: `User job search: """${q}"""` },
        ],
      })
      try {
        intent = { ...intent, ...JSON.parse(completion.choices[0].message.content || '{}') }
      } catch {
        // Ignore malformed JSON and keep defaults.
      }
    }

    const country = intent.country_code || ADZUNA_DEFAULT_COUNTRY
    const params = buildAdzunaParams(intent, q)
    const url = `${ADZUNA_BASE_URL}/jobs/${country}/search/1?${params.toString()}`

    const adzunaRes = await fetch(url)
    if (!adzunaRes.ok) {
      const text = await adzunaRes.text()
      return res.status(adzunaRes.status).json({ error: `Adzuna error ${adzunaRes.status}`, details: text })
    }
    const data = await adzunaRes.json()
    const results = (data.results || []).map((r, i) => normalizeJob(r, i))
    return res.json({ jobs: results })
  } catch (err) {
    console.error('AI job search error:', err)
    return res.status(500).json({ error: 'AI job search failed', message: err.message })
  }
})

// Fetch and summarise a job's full description from the original vacancy page.
// Body: { url: string, title?: string, company?: string, location?: string, experience?: string }
app.post('/api/job-summary', async (req, res) => {
  const { url, title, company, location, experience } = req.body || {}
  if (!url || !String(url).trim()) {
    return res.status(400).json({ error: 'Job URL is required' })
  }
  if (!openai || !OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key is not configured on the server' })
  }
  if (!SCRAPINGBEE_API_KEY) {
    return res.status(500).json({ error: 'Browse API key (SCRAPINGBEE_API_KEY) is not configured on the server' })
  }

  try {
    const sbParams = new URLSearchParams({
      api_key: SCRAPINGBEE_API_KEY,
      url,
      render_js: 'false',
      return_page_text: 'true',
    })
    const targetUrl = `${SCRAPINGBEE_BASE_URL}?${sbParams.toString()}`

    const pageRes = await fetch(targetUrl)
    if (!pageRes.ok) {
      const text = await pageRes.text()
      console.error(`ScrapingBee error ${pageRes.status}:`, text.slice(0, 500))
      return res
        .status(pageRes.status)
        .json({ error: `Browse API error ${pageRes.status}`, details: text.slice(0, 300) })
    }

    const pageText = await pageRes.text()
    const snippet = pageText.slice(0, 8000)

    if (!snippet.trim()) {
      return res.json({ summary: null, fallback: true })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise job-description summariser. ' +
            'Given text content from a job vacancy page plus some structured hints, extract ONLY the actual job description and summarise it briefly for a candidate. ' +
            'Output 4–7 short bullet points covering: main responsibilities, key requirements/skills, seniority level, work model (remote/hybrid/on-site), location, salary/compensation if present, and anything uniquely important. ' +
            'If the page text does not clearly state the location or seniority, fall back to the provided hints instead of saying they are not provided. ' +
            'Write in clear, neutral English, suitable for displaying in an "About this role" section. Do not mention that you are summarising.',
        },
        {
          role: 'user',
          content:
            `Job title: ${title || 'Unknown'}\n` +
            `Company: ${company || 'Unknown'}\n` +
            `Location from feed: ${location || 'Unknown'}\n` +
            `Seniority from feed: ${experience || 'Unknown'}\n` +
            `URL: ${url}\n\n` +
            'Page text content:\n' +
            snippet,
        },
      ],
    })

    const summary = completion.choices[0]?.message?.content?.trim() || null
    return res.json({ summary })
  } catch (err) {
    console.error('Job summary error:', err)
    return res.status(500).json({ error: 'Job summary failed', message: err.message })
  }
})

// Startup: validate required env and log clear errors
const hasOpenAI = !!(process.env.VITE_GPT_API_KEY || process.env.OPENAI_API_KEY)
const hasAdzuna = !!(ADZUNA_APP_ID && ADZUNA_APP_KEY)
const hasSupabaseService = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
if (!hasAdzuna) {
  console.warn('[AI Server] VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY are required in .env for job search. Get keys: https://developer.adzuna.com/')
}
if (!hasOpenAI) {
  console.warn('[AI Server] VITE_GPT_API_KEY (or OPENAI_API_KEY) not set. Smart query parsing disabled; job-summary and AI resumer parsing/matching will fail.')
}
if (!hasSupabaseService) {
  console.warn('[AI Server] VITE_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for AI Resumer endpoints.')
}

const PORT = process.env.AI_SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`AI Job Search server: http://localhost:${PORT}`)
  if (!hasAdzuna) console.log('  -> Add Adzuna keys to .env to enable job search.')
  if (!hasOpenAI) console.log('  -> Add VITE_GPT_API_KEY to .env for AI features.')
  if (!hasSupabaseService) console.log('  -> Add Supabase service-role credentials to .env for AI Resumer endpoints.')
})
