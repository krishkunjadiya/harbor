-- Fix: Add RPC function to increment job applications_count safely (bypasses RLS)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.increment_job_applications_count(job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET applications_count = COALESCE(applications_count, 0) + 1
  WHERE id = job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_job_applications_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_job_applications_count(UUID) TO anon;

-- Also add UPDATE policy for jobs so recruiter can update their own jobs without SECURITY DEFINER
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Recruiters can update their own jobs'
  ) THEN
    CREATE POLICY "Recruiters can update their own jobs"
      ON public.jobs FOR UPDATE
      USING (auth.uid() = recruiter_id);
  END IF;
END;
$$;
