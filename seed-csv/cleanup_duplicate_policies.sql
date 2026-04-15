-- Clean up duplicate RLS policies for job_applications

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Students can apply to jobs" ON public.job_applications;

-- Verify remaining policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'job_applications'
ORDER BY cmd, policyname;
