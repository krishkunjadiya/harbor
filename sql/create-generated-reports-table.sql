-- ============================================================
-- Generated Reports History Table
-- Purpose:
-- 1) Persist recruiter report generation history
-- 2) Support Recent Reports UI in recruiter dashboard
-- 3) Enforce recruiter-scoped row access with RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('applications', 'candidates', 'interviews', 'performance')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel', 'pdf')),
  file_name TEXT NOT NULL,
  date_range INTEGER NOT NULL CHECK (date_range > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_recruiter_created_at
  ON public.generated_reports (recruiter_id, created_at DESC);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_reports_select_own" ON public.generated_reports;
CREATE POLICY "generated_reports_select_own"
  ON public.generated_reports
  FOR SELECT
  USING (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "generated_reports_insert_own" ON public.generated_reports;
CREATE POLICY "generated_reports_insert_own"
  ON public.generated_reports
  FOR INSERT
  WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "generated_reports_delete_own" ON public.generated_reports;
CREATE POLICY "generated_reports_delete_own"
  ON public.generated_reports
  FOR DELETE
  USING (recruiter_id = auth.uid());

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_reports';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Verification
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'generated_reports';

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'generated_reports'
ORDER BY cmd, policyname;
