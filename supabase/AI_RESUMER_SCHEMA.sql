-- =========================================================
-- AI Resumer schema + RLS + storage policies + realtime
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('upload', 'manual')),
  file_url text,
  raw_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  age int,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills text[] NOT NULL DEFAULT '{}',
  work_experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  internships jsonb NOT NULL DEFAULT '[]'::jsonb,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  swipy_startup_id uuid REFERENCES public.startups(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Supports databases where this migration was applied before achievements existed.
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS achievements jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text,
  job_source text,
  apply_url text,
  match_score int NOT NULL,
  why_match text,
  rewritten_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  rank int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'parsing', 'matching', 'completed', 'failed')),
  stage_message text,
  error text,
  result_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id_created_at ON public.resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id_updated_at ON public.candidate_profiles(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_matches_profile_rank ON public.job_matches(candidate_profile_id, rank);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id_created_at ON public.processing_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);

CREATE OR REPLACE FUNCTION public.set_processing_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER trg_processing_jobs_updated_at
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_processing_jobs_updated_at();

-- =========================================================
-- RLS
-- =========================================================

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;

CREATE POLICY "resumes_select_own"
ON public.resumes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "resumes_insert_own"
ON public.resumes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_own"
ON public.resumes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_delete_own"
ON public.resumes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "candidate_profiles_select_own" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_insert_own" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_update_own" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_delete_own" ON public.candidate_profiles;

CREATE POLICY "candidate_profiles_select_own"
ON public.candidate_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_insert_own"
ON public.candidate_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_update_own"
ON public.candidate_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_delete_own"
ON public.candidate_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "job_matches_select_own" ON public.job_matches;
DROP POLICY IF EXISTS "job_matches_insert_own" ON public.job_matches;
DROP POLICY IF EXISTS "job_matches_update_own" ON public.job_matches;
DROP POLICY IF EXISTS "job_matches_delete_own" ON public.job_matches;

CREATE POLICY "job_matches_select_own"
ON public.job_matches FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "job_matches_insert_own"
ON public.job_matches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "job_matches_update_own"
ON public.job_matches FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "job_matches_delete_own"
ON public.job_matches FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "processing_jobs_select_own" ON public.processing_jobs;
DROP POLICY IF EXISTS "processing_jobs_insert_own" ON public.processing_jobs;
DROP POLICY IF EXISTS "processing_jobs_update_own" ON public.processing_jobs;
DROP POLICY IF EXISTS "processing_jobs_delete_own" ON public.processing_jobs;

CREATE POLICY "processing_jobs_select_own"
ON public.processing_jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "processing_jobs_insert_own"
ON public.processing_jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "processing_jobs_update_own"
ON public.processing_jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "processing_jobs_delete_own"
ON public.processing_jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- Storage bucket and policies
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
SELECT 'resumes', 'resumes', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'resumes'
);

DROP POLICY IF EXISTS "resumes_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_select_own" ON storage.objects;

CREATE POLICY "resumes_storage_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "resumes_storage_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "resumes_storage_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "resumes_storage_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================
-- Realtime for processing_jobs
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'processing_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_jobs;
  END IF;
END $$;
