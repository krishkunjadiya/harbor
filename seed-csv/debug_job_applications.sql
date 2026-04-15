-- Check job_applications table data and relationships
-- Run this in Supabase SQL Editor to debug the issue

-- 1. Check if table exists and has data
SELECT COUNT(*) as total_applications FROM public.job_applications;

-- 2. Check for any orphaned records (applications without valid jobs)
SELECT COUNT(*) as orphaned_applications 
FROM public.job_applications ja
LEFT JOIN public.jobs j ON ja.job_id = j.id
WHERE j.id IS NULL;

-- 3. Check for any orphaned records (applications without valid students)
SELECT COUNT(*) as orphaned_students 
FROM public.job_applications ja
LEFT JOIN public.profiles p ON ja.student_id = p.id
WHERE p.id IS NULL;

-- 4. Sample data with join
SELECT 
  ja.id,
  ja.student_id,
  ja.job_id,
  ja.status,
  ja.applied_at,
  j.title as job_title,
  p.full_name as student_name
FROM public.job_applications ja
LEFT JOIN public.jobs j ON ja.job_id = j.id
LEFT JOIN public.profiles p ON ja.student_id = p.id
LIMIT 5;

-- 5. Check if RLS is blocking the query
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'job_applications';
