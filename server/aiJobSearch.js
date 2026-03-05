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
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY
const SCRAPINGBEE_BASE_URL = 'https://app.scrapingbee.com/api/v1'

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
      } catch (_) { }
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
      url: url,
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
if (!hasAdzuna) {
  console.warn('[AI Server] VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY are required in .env for job search. Get keys: https://developer.adzuna.com/')
}
if (!hasOpenAI) {
  console.warn('[AI Server] VITE_GPT_API_KEY (or OPENAI_API_KEY) not set. Smart query parsing disabled; job-summary will fail. Get key: https://platform.openai.com/api-keys')
}

const PORT = process.env.AI_SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`AI Job Search server: http://localhost:${PORT}`)
  if (!hasAdzuna) console.log('  -> Add Adzuna keys to .env to enable job search.')
  if (!hasOpenAI) console.log('  -> Add VITE_GPT_API_KEY to .env for AI features.')
})
