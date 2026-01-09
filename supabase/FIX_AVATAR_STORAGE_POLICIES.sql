-- ============================================
-- FIX AVATAR STORAGE RLS POLICIES
-- ============================================
-- This fixes the "new row violates row-level security policy" error
-- when uploading avatars.
--
-- The issue: Code uploads files to avatars/{userId}-{timestamp}.ext
-- but old policies expected avatars/{userId}/filename.ext
--
-- Solution: Use simpler policies that allow authenticated users to upload
-- to avatars bucket. Files already have unique names with userId prefix.
-- ============================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload avatars
-- Files must be in 'avatars' bucket and filename must start with user's ID
-- Format in code: avatars/{userId}-{timestamp}.ext
-- In storage.objects.name this becomes: avatars/{userId}-{timestamp}.ext
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    name LIKE (select auth.uid())::text || '-%' OR
    name LIKE 'avatars/' || (select auth.uid())::text || '-%'
  )
);

-- Policy 2: Allow authenticated users to update their own avatars
-- Files must be in 'avatars' bucket and filename must start with user's ID
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    name LIKE (select auth.uid())::text || '-%' OR
    name LIKE 'avatars/' || (select auth.uid())::text || '-%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    name LIKE (select auth.uid())::text || '-%' OR
    name LIKE 'avatars/' || (select auth.uid())::text || '-%'
  )
);

-- Policy 3: Allow authenticated users to delete their own avatars
-- Files must be in 'avatars' bucket and filename must start with user's ID
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    name LIKE (select auth.uid())::text || '-%' OR
    name LIKE 'avatars/' || (select auth.uid())::text || '-%'
  )
);

-- Policy 4: Allow public read access to avatars
-- (Since bucket is public, anyone can read)
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- VERIFY SETUP
-- ============================================
-- After running this, verify with:
-- SELECT * FROM storage.buckets WHERE name = 'avatars';
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%avatar%';

