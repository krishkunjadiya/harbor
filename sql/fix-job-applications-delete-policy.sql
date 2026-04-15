-- ============================================================
-- FIX: Add missing DELETE policy for job_applications
-- ============================================================
-- Without this, students cannot withdraw their own applications.
-- RLS blocks DELETE when no policy exists, but returns no error
-- (0 rows deleted), so withdrawApplication silently does nothing.
-- ============================================================

-- Drop any stale delete policies first to avoid conflicts
DROP POLICY IF EXISTS "applications_delete_student" ON public.job_applications;
DROP POLICY IF EXISTS "Students can delete own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.job_applications;

-- Students can delete (withdraw) their own applications
CREATE POLICY "applications_delete_student"
  ON public.job_applications
  FOR DELETE
  USING (student_id = auth.uid());

-- Verify
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'job_applications'
ORDER BY cmd, policyname;
