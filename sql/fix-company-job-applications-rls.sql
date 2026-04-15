-- ============================================================
-- ROOT CAUSE FIX: Company-wide job application visibility
-- ============================================================
-- The CSV seeds TechCorp jobs across multiple recruiter IDs
-- (job-0001 → 3001, job-0021 → 3021, job-0041 → 3041).
-- Querying by recruiter_id alone means each recruiter only sees
-- applications for the ONE job they own, not all company jobs.
--
-- Fix: Add a SECURITY DEFINER helper that resolves the recruiter's
-- company name, then broaden the SELECT / UPDATE policies so any
-- recruiter at the same company can see all company applications.
-- Also adds the missing DELETE policy for student withdrawals.
-- ============================================================

-- ============================================================
-- STEP 1: Helper function – recruiter's company name
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_recruiter_company()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER        -- bypasses RLS on the recruiters table
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN COALESCE(
        -- profile_id column (added by complete-schema-sync.sql)
        (SELECT NULLIF(TRIM(company_name), '')
           FROM public.recruiters
          WHERE profile_id = auth.uid()
          LIMIT 1),
        -- id column (original PK = profile id)
        (SELECT NULLIF(TRIM(company_name), '')
           FROM public.recruiters
          WHERE id = auth.uid()
          LIMIT 1),
        -- fall back to the plain company column
        (SELECT NULLIF(TRIM(company), '')
           FROM public.recruiters
          WHERE profile_id = auth.uid()
          LIMIT 1),
        (SELECT NULLIF(TRIM(company), '')
           FROM public.recruiters
          WHERE id = auth.uid()
          LIMIT 1)
    );
END;
$$;

-- ============================================================
-- STEP 2: Drop ALL existing job_applications policies
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'job_applications'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_applications', r.policyname);
    END LOOP;
END $$;

-- ============================================================
-- STEP 3: Recreate policies with company-wide access
-- ============================================================

-- SELECT: student sees own apps; recruiter sees company apps
CREATE POLICY "applications_select_own"
  ON public.job_applications FOR SELECT
  USING (
    -- Student viewing their own applications
    student_id = auth.uid()
    OR
    -- Recruiter viewing applications for any job at their company
    job_id IN (
      SELECT id FROM public.jobs
      WHERE
        recruiter_id = auth.uid()
        OR (
          public.get_current_recruiter_company() IS NOT NULL
          AND company = public.get_current_recruiter_company()
        )
    )
  );

-- INSERT: only the authenticated student may submit
CREATE POLICY "applications_insert_student"
  ON public.job_applications FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- UPDATE: recruiter may update any application for their company's jobs
CREATE POLICY "applications_update_recruiter"
  ON public.job_applications FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM public.jobs
      WHERE
        recruiter_id = auth.uid()
        OR (
          public.get_current_recruiter_company() IS NOT NULL
          AND company = public.get_current_recruiter_company()
        )
    )
  );

-- DELETE: student may withdraw their own application
CREATE POLICY "applications_delete_student"
  ON public.job_applications FOR DELETE
  USING (student_id = auth.uid());

-- ============================================================
-- STEP 4: Verify
-- ============================================================
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'job_applications'
ORDER BY cmd, policyname;
