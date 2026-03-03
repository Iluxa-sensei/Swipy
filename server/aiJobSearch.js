/**
 * AI-assisted job search server.
 * Uses OpenAI to interpret the user's query and Adzuna API to fetch jobs.
 * Run: npm run ai-server (with .env containing VITE_GPT_API_KEY, VITE_ADZUNA_APP_ID, VITE_ADZUNA_APP_KEY)
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config({ path: '.env' })

const app = express()
app.use(cors())
app.use(express.json())

const ADZUNA_APP_ID = process.env.VITE_ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.VITE_ADZUNA_APP_KEY
const ADZUNA_DEFAULT_COUNTRY = process.env.ADZUNA_COUNTRY || 'gb'
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api'
const OPENAI_API_KEY = process.env.VITE_GPT_API_KEY || process.env.OPENAI_API_KEY

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
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

function normalizeJob(result, index) {
  return {
    id: String(result.id),
    title: result.title || 'Untitled Position',
    company: result.company?.display_name || 'Company not specified',
    location: result.location?.display_name || 'Location not specified',
    type: formatContractType(result.contract_type, result.contract_time),
    experience: null,
    shortDescription: result.description || '',
    fullDescription: result.description || 'No description available.',
    salary: formatSalary(result.salary_min, result.salary_max),
    tags: result.category ? [result.category.tag] : [],
    gradient: GRADIENTS[index % GRADIENTS.length],
    postedDate: formatPostedDate(result.created),
    urlPlaceholder: result.redirect_url || '#',
  }
}

app.post('/api/ai-job-search', async (req, res) => {
  const { query } = req.body || {}
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: 'Query is required' })
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
              'Return ONLY a single JSON object with these exact keys: keywords (string), location (string or null), country_code (string or null, e.g. gb, us), salary_min (number or null), ' +
              'employment_type (one of: full_time, part_time, any), contract_type (one of: permanent, contract, any), exclude_keywords (array of strings), sort_by (date or salary or null), results_per_page (number or null). ' +
              'Extract job titles, skills, and locations from the user text. If unclear, use null or "any".',
          },
          { role: 'user', content: `User job search: """${q}"""` },
        ],
      })
      try {
        intent = { ...intent, ...JSON.parse(completion.choices[0].message.content || '{}') }
      } catch (_) {}
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

const PORT = process.env.AI_SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`AI Job Search server: http://localhost:${PORT}`)
})
