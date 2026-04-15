-- SQL Script to fix Job Views tracking
-- 1. Create a function to increment job views that bypasses RLS
-- 2. Reset existing mock view counts to 0 for a fresh start

-- Create the increment function
CREATE OR REPLACE FUNCTION public.increment_job_views(job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = increment_job_views.job_id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_job_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_job_views(UUID) TO anon;

-- Reset existing mock data views to 0 so it doesn't show the hardcoded "150"
UPDATE public.jobs SET views_count = 0;

-- Optional: If you want to keep some "history", set them to small random numbers instead
-- UPDATE public.jobs SET views_count = floor(random() * 10 + 1)::int;
