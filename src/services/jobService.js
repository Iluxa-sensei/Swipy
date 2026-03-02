// Adzuna Job Search API service
// Docs: https://developer.adzuna.com/overview
//       https://developer.adzuna.com/docs/search

// Adzuna credentials are provided via Vite env variables.
// Set VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY in your .env file.
const ADZUNA_APP_ID = import.meta.env.VITE_ADZUNA_APP_ID
const ADZUNA_APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY
const ADZUNA_COUNTRY = 'gb'
const RESULTS_PER_PAGE = 6

const BASE_URL = 'https://api.adzuna.com/v1/api'

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

let cachedJobs = []

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
    if (contractTime) {
        parts.push(contractTime.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    }
    if (contractType) {
        parts.push(contractType.replace(/\b\w/g, (c) => c.toUpperCase()))
    }
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

/**
 * Search jobs via the Adzuna API.
 * Returns at most RESULTS_PER_PAGE (6) normalised job objects.
 */
export async function searchJobs(query) {
    if (!query || !query.trim()) return []

    const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        results_per_page: String(RESULTS_PER_PAGE),
        what: query.trim(),
        'content-type': 'application/json',
    })

    const url = `${BASE_URL}/jobs/${ADZUNA_COUNTRY}/search/1?${params}`

    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const results = (data.results || []).map(normalizeJob)

    cachedJobs = results
    return results
}

/**
 * Look up a job by ID from the most recent search results cache.
 * Returns null if the job isn't in cache (e.g. direct URL access).
 */
export function getJobById(id) {
    return cachedJobs.find((job) => job.id === String(id)) || null
}
