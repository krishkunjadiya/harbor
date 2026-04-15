-- Check RLS status and policies on jobs table

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'jobs';

-- 2. Check existing policies on jobs table
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'jobs'
ORDER BY cmd, policyname;

-- 3. Test query that should work
SELECT COUNT(*) FROM public.jobs;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;

-- 5. Create policy to allow viewing jobs
CREATE POLICY "Authenticated users can view all jobs"
  ON public.jobs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. Verify policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'jobs'
ORDER BY cmd, policyname;
