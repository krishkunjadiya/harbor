-- Check and fix RLS policies for job_applications table

-- 1. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'job_applications';

-- 2. Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Students can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Students can update their applications" ON public.job_applications;

-- 3. Create proper RLS policies

-- Students can view their own applications
CREATE POLICY "Students can view their own applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create their own applications
CREATE POLICY "Students can create applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own applications
CREATE POLICY "Students can update their applications"
  ON public.job_applications
  FOR UPDATE
  USING (auth.uid() = student_id);

-- Recruiters can view applications for their jobs
CREATE POLICY "Recruiters can view applications for their jobs"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Recruiters can update applications for their jobs
CREATE POLICY "Recruiters can update applications for their jobs"
  ON public.job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- 4. Verify policies are created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'job_applications'
ORDER BY policyname;
