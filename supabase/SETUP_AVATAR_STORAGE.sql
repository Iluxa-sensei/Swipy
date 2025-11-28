-- ============================================
-- SETUP AVATAR STORAGE BUCKET
-- ============================================
-- This file contains instructions for setting up avatar storage
-- 
-- IMPORTANT: This SQL file cannot create storage buckets directly.
-- You need to create the bucket manually in Supabase Dashboard.
--
-- Steps to set up avatar storage:
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: "avatars"
-- 4. Public bucket: YES (checked)
-- 5. File size limit: 5MB (or your preferred limit)
-- 6. Allowed MIME types: image/*
-- 7. Click "Create bucket"
--
-- ============================================
-- STORAGE POLICIES (RLS)
-- ============================================
-- After creating the bucket, set up these policies using storage.objects table

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload avatars
-- (Users can upload files where the folder name matches their user ID)
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own avatars
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own avatars
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to avatars
-- (Since bucket is public, anyone can read)
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- ALTERNATIVE: Simpler policies (if folder-based doesn't work)
-- ============================================
-- If the above policies don't work, you can use these simpler ones:
-- (Less secure - allows any authenticated user to upload/update/delete any avatar)
/*
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;

-- Create simpler policies
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
*/

-- ============================================
-- VERIFY SETUP
-- ============================================
-- After setting up, verify with:
-- SELECT * FROM storage.buckets WHERE name = 'avatars';
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%avatar%';

