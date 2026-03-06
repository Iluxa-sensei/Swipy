import { supabase } from './supabaseClient.js'

const STORAGE_KEY = 'swipy_starred_jobs'
const TABLE_NAME = 'starred_jobs'

function readLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

/**
 * One-time migration of old localStorage-based starred jobs into Supabase
 * for the given user, then clears the localStorage key.
 *
 * @param {string} userId
 */
async function migrateLocalToSupabase(userId) {
    if (!userId) return

    const localJobs = readLocal()
    if (!Array.isArray(localJobs) || localJobs.length === 0) return

    try {
        const rows = localJobs
            .filter((job) => job && job.id)
            .map((job) => ({
                user_id: userId,
                job_id: String(job.id),
                job_data: job
            }))

        if (rows.length === 0) return

        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(rows, { onConflict: 'user_id,job_id' })

        if (error) {
            console.warn('starredJobs: migration to Supabase failed', error)
            return
        }

        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {
            // ignore
        }
    } catch (e) {
        console.warn('starredJobs: migration error', e)
    }
}

/**
 * Fetch starred jobs for the current user from Supabase.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ id: string, title: string, company: string }>>}
 */
export async function getStarredJobs(userId) {
    if (!userId) return []

    await migrateLocalToSupabase(userId)

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('job_id, job_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('starredJobs: getStarredJobs failed', error)
            return []
        }

        return (data || []).map((row) => {
            const job = row.job_data || {}
            const id = row.job_id || job.id
            return { ...job, id }
        })
    } catch (e) {
        console.error('starredJobs: getStarredJobs unexpected error', e)
        return []
    }
}

/**
 * Add a job to the current user's starred list.
 *
 * @param {string} userId
 * @param {{ id: string, title: string, company: string }} job
 */
export async function addStarredJob(userId, job) {
    if (!userId || !job?.id) return

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(
                {
                    user_id: userId,
                    job_id: String(job.id),
                    job_data: job
                },
                { onConflict: 'user_id,job_id' }
            )

        if (error) {
            console.error('starredJobs: addStarredJob failed', error)
        }
    } catch (e) {
        console.error('starredJobs: addStarredJob unexpected error', e)
    }
}

/**
 * Remove a job from the current user's starred list.
 *
 * @param {string} userId
 * @param {string} jobId
 */
export async function removeStarredJob(userId, jobId) {
    if (!userId || !jobId) return

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('user_id', userId)
            .eq('job_id', String(jobId))

        if (error) {
            console.error('starredJobs: removeStarredJob failed', error)
        }
    } catch (e) {
        console.error('starredJobs: removeStarredJob unexpected error', e)
    }
}

/**
 * Check if a given job is starred for the current user.
 *
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
export async function isStarred(userId, jobId) {
    if (!userId || !jobId) return false

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('id')
            .eq('user_id', userId)
            .eq('job_id', String(jobId))
            .limit(1)
            .maybeSingle()

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('starredJobs: isStarred failed', error)
            }
            return false
        }

        return !!data
    } catch (e) {
        console.error('starredJobs: isStarred unexpected error', e)
        return false
    }
}
