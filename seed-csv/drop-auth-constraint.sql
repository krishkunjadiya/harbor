-- =============================================
-- STEP 1: DROP FOREIGN KEY CONSTRAINT ON PROFILES TABLE
-- This allows us to import CSV data without creating auth.users first
-- =============================================

-- Drop the foreign key constraint that references auth.users
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- =============================================
-- INSTRUCTIONS:
-- =============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Import all CSV files in the following order:
--    a. profiles.csv (157 rows)
--    b. departments.csv (4 rows)
--    c. badges.csv (50 rows)
--    d. universities.csv (2 rows)
--    e. students.csv (50 rows)
--    f. recruiters.csv (50 rows)
--    g. faculty.csv (50 rows)
--    h. admin_staff.csv (3 rows)
--    i. courses.csv (50 rows)
--    j. user_badges.csv (50 rows)
--    k. credentials.csv (50 rows)
--    l. jobs.csv (50 rows)
--    m. job_applications.csv (50 rows)
--    n. user_activity.csv (50 rows)
--    o. dashboard_stats.csv (50 rows)
--    p. notifications.csv (50 rows)
--    q. student_projects.csv (50 rows)
--    r. academic_records.csv (50 rows)
--    s. student_full_records.csv (50 rows)
--    t. user_skills.csv (50 rows)
--    u. career_insights.csv (50 rows)
-- 3. After importing, run restore-auth-constraint.sql to restore the constraint
-- =============================================

-- Verify the constraint is dropped
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'profiles_id_fkey';
-- This should return 0 rows after running the script
