-- =============================================
-- HARBOR STORAGE SETUP
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Create Storage Buckets
-- =============================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create resumes bucket (public for authenticated users)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Create credentials bucket (public for authenticated users)
INSERT INTO storage.buckets (id, name, public)
VALUES ('credentials', 'credentials', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Storage Policies - Avatars Bucket
-- =============================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Step 3: Storage Policies - Resumes Bucket
-- =============================================

-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resume"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own resumes
CREATE POLICY "Users can update their own resume"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete their own resume"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view all resumes (for recruiters)
CREATE POLICY "Authenticated users can view resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Step 4: Storage Policies - Credentials Bucket
-- =============================================

-- Allow authenticated users to upload their own credentials
CREATE POLICY "Users can upload their own credentials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'credentials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own credentials
CREATE POLICY "Users can update their own credentials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'credentials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own credentials
CREATE POLICY "Users can delete their own credentials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'credentials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view all credentials (for verification)
CREATE POLICY "Authenticated users can view credentials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'credentials');

-- Step 5: Database Schema Updates
-- =============================================

-- Add resume_url column to students table if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE students ADD COLUMN resume_url TEXT;
  END IF;
END $$;

-- Add document_url to credentials table if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credentials') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credentials' AND column_name = 'document_url'
    ) THEN
      ALTER TABLE credentials ADD COLUMN document_url TEXT;
    END IF;
  END IF;
END $$;

-- Step 6: Enable Realtime (Optional)
-- =============================================

-- Enable Realtime for notifications
ALTER publication supabase_realtime ADD TABLE notifications;

-- Enable Realtime for job_applications  
ALTER publication supabase_realtime ADD TABLE job_applications;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully!';
  RAISE NOTICE '✅ Database schema updated with storage URLs';
  RAISE NOTICE '✅ Realtime enabled for notifications and job applications';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '1. Verify buckets in Storage section';
  RAISE NOTICE '2. Test file uploads from your application';
  RAISE NOTICE '3. Check RLS policies are working correctly';
END $$;
