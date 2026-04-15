-- ============================================================
-- Recruiter Analytics Consistency Hardening
-- Purpose:
-- 1) Keep recruiter analytics/applications/jobs in sync company-wide
-- 2) Standardize RLS for company-scoped recruiter visibility
-- 3) Ensure realtime publication includes analytics-driving tables
-- 4) Add helpful indexes for analytics query paths
--
-- Safe to run multiple times (idempotent where possible).
-- ============================================================

-- ------------------------------------------------------------
-- STEP 0: Defensive schema alignment for recruiter/company fields
-- ------------------------------------------------------------
ALTER TABLE public.recruiters
  ADD COLUMN IF NOT EXISTS profile_id UUID,
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Backfill profile_id from id when legacy schema used id as profile FK.
UPDATE public.recruiters
SET profile_id = id
WHERE profile_id IS NULL AND id IS NOT NULL;

-- Keep company_name available even if only company was populated.
UPDATE public.recruiters
SET company_name = company
WHERE (company_name IS NULL OR TRIM(company_name) = '')
  AND company IS NOT NULL
  AND TRIM(company) <> '';

-- ------------------------------------------------------------
-- STEP 1: Helper function for current recruiter's company
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_recruiter_company()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT NULLIF(TRIM(company_name), '') FROM public.recruiters WHERE profile_id = auth.uid() LIMIT 1),
    (SELECT NULLIF(TRIM(company_name), '') FROM public.recruiters WHERE id = auth.uid() LIMIT 1),
    (SELECT NULLIF(TRIM(company), '') FROM public.recruiters WHERE profile_id = auth.uid() LIMIT 1),
    (SELECT NULLIF(TRIM(company), '') FROM public.recruiters WHERE id = auth.uid() LIMIT 1)
  );
END;
$$;

-- ------------------------------------------------------------
-- STEP 2: Jobs policies (company-scoped recruiter visibility)
-- ------------------------------------------------------------
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_active" ON public.jobs;
DROP POLICY IF EXISTS "Active jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;

CREATE POLICY "jobs_select_company_or_active"
  ON public.jobs
  FOR SELECT
  USING (
    status = 'active'
    OR recruiter_id = auth.uid()
    OR (
      public.get_current_recruiter_company() IS NOT NULL
      AND company = public.get_current_recruiter_company()
    )
  );

-- Keep inserts/updates owner-scoped.
DROP POLICY IF EXISTS "jobs_insert_recruiter" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can create jobs" ON public.jobs;
CREATE POLICY "jobs_insert_recruiter"
  ON public.jobs
  FOR INSERT
  WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "jobs_update_recruiter" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.jobs;
CREATE POLICY "jobs_update_recruiter"
  ON public.jobs
  FOR UPDATE
  USING (recruiter_id = auth.uid());

-- ------------------------------------------------------------
-- STEP 3: Job applications policies (company-scoped recruiter access)
-- ------------------------------------------------------------
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_applications'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_applications', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "applications_select_own"
  ON public.job_applications FOR SELECT
  USING (
    student_id = auth.uid()
    OR job_id IN (
      SELECT id
      FROM public.jobs
      WHERE recruiter_id = auth.uid()
         OR (
           public.get_current_recruiter_company() IS NOT NULL
           AND company = public.get_current_recruiter_company()
         )
    )
  );

CREATE POLICY "applications_insert_student"
  ON public.job_applications FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "applications_update_recruiter"
  ON public.job_applications FOR UPDATE
  USING (
    job_id IN (
      SELECT id
      FROM public.jobs
      WHERE recruiter_id = auth.uid()
         OR (
           public.get_current_recruiter_company() IS NOT NULL
           AND company = public.get_current_recruiter_company()
         )
    )
  );

CREATE POLICY "applications_delete_student"
  ON public.job_applications FOR DELETE
  USING (student_id = auth.uid());

-- ------------------------------------------------------------
-- STEP 4: Realtime publication for analytics triggers
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_applications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jobs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'interviews'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ------------------------------------------------------------
-- STEP 5: Performance indexes for analytics paths
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_company ON public.jobs(recruiter_id, company);
CREATE INDEX IF NOT EXISTS idx_recruiters_profile_company ON public.recruiters(profile_id, company_name);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status ON public.job_applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications(applied_at DESC);

-- ------------------------------------------------------------
-- STEP 6: Verification snippets
-- ------------------------------------------------------------
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'job_applications')
ORDER BY tablename, cmd, policyname;

SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('jobs', 'job_applications', 'interviews')
ORDER BY tablename;
