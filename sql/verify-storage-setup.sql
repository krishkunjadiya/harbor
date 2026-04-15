-- =============================================
-- VERIFICATION QUERIES
-- Run these to check your storage setup
-- =============================================

-- Query 1: Check if buckets exist
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id IN ('avatars', 'resumes', 'credentials')
ORDER BY name;

-- Expected result: 3 rows
-- avatars (public=true)
-- credentials (public=true)
-- resumes (public=true)

-- =============================================

-- Query 2: Check bucket policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Expected result: 12 policies (4 per bucket)
-- Each bucket should have:
--   - INSERT policy (upload)
--   - UPDATE policy (update)
--   - DELETE policy (delete)
--   - SELECT policy (view)

-- =============================================

-- Query 3: Check database columns added
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name = 'avatar_url')
    OR (table_name = 'students' AND column_name = 'resume_url')
    OR (table_name = 'credentials' AND column_name = 'document_url')
  )
ORDER BY table_name, column_name;

-- Expected result: 3 rows
-- profiles.avatar_url (text)
-- students.resume_url (text)
-- credentials.document_url (text)

-- =============================================

-- Query 4: Check realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('notifications', 'job_applications')
ORDER BY tablename;

-- Expected result: 2 rows
-- notifications
-- job_applications

-- =============================================

-- Query 5: List all files in storage (after uploading)
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
ORDER BY created_at DESC
LIMIT 10;

-- Expected result: Initially empty, shows files after upload

-- =============================================

-- Query 6: Count files per bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- Expected result: Shows storage usage per bucket

-- =============================================

-- Query 7: Check for any errors in setup
DO $$
DECLARE
  bucket_count INT;
  policy_count INT;
  column_count INT;
BEGIN
  -- Count buckets
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id IN ('avatars', 'resumes', 'credentials');
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%avatar%' 
     OR policyname LIKE '%resume%'
     OR policyname LIKE '%credential%';
  
  -- Count columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'profiles' AND column_name = 'avatar_url')
      OR (table_name = 'students' AND column_name = 'resume_url')
      OR (table_name = 'credentials' AND column_name = 'document_url')
    );
  
  -- Report results
  RAISE NOTICE '=================================';
  RAISE NOTICE 'STORAGE SETUP VERIFICATION';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Buckets created: % / 3', bucket_count;
  RAISE NOTICE 'Policies created: % / 12', policy_count;
  RAISE NOTICE 'Database columns: % / 3', column_count;
  RAISE NOTICE '=================================';
  
  IF bucket_count = 3 AND policy_count >= 12 AND column_count = 3 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED!';
    RAISE NOTICE 'Storage setup is complete and ready to use.';
  ELSE
    RAISE NOTICE '⚠️ SOME CHECKS FAILED';
    RAISE NOTICE 'Please re-run setup-storage-buckets.sql';
  END IF;
  RAISE NOTICE '=================================';
END $$;

-- =============================================

-- Query 8: Test bucket access (safe to run)
SELECT 
  bucket_id,
  name,
  id,
  created_at
FROM storage.objects
WHERE bucket_id = 'avatars'
LIMIT 5;

-- Expected: Empty or shows uploaded files

-- =============================================

-- CLEANUP QUERIES (use with caution!)
-- =============================================

-- Remove all files from a bucket (use carefully!)
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';
-- DELETE FROM storage.objects WHERE bucket_id = 'resumes';
-- DELETE FROM storage.objects WHERE bucket_id = 'credentials';

-- Drop buckets (only if you need to start over)
-- DELETE FROM storage.buckets WHERE id = 'avatars';
-- DELETE FROM storage.buckets WHERE id = 'resumes';
-- DELETE FROM storage.buckets WHERE id = 'credentials';

-- Drop policies (only if you need to recreate them)
-- DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
-- (repeat for resumes and credentials)

-- =============================================
-- END OF VERIFICATION QUERIES
-- =============================================
