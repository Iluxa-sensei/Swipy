const STORAGE_KEY = 'swipy_starred_jobs'

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function write(jobs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
    } catch (e) {
        console.warn('starredJobs: write failed', e)
    }
}

/**
 * @returns {Array<{ id: string, title: string, company: string, ... }>}
 */
export function getStarredJobs() {
    return read()
}

/**
 * @param {{ id: string, title: string, company: string, ... }} job
 */
export function addStarredJob(job) {
    const jobs = read()
    if (jobs.some((j) => j.id === job.id)) return
    write([...jobs, job])
}

/**
 * @param {string} id
 */
export function removeStarredJob(id) {
    const jobs = read().filter((j) => j.id !== id)
    write(jobs)
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isStarred(id) {
    return read().some((j) => j.id === id)
}
