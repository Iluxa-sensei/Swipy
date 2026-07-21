-- Ensure there is at most one active matching job per candidate profile.
CREATE UNIQUE INDEX IF NOT EXISTS idx_processing_jobs_one_active_per_profile
ON public.processing_jobs (candidate_profile_id)
WHERE status IN ('queued', 'parsing', 'matching');
