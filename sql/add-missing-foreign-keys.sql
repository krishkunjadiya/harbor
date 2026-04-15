-- ============================================================
-- Add Missing Foreign Key Constraints for Faculty Operations
-- ============================================================
-- This script adds the missing foreign key relationships needed
-- for Supabase PostgREST API to work properly with nested selects

-- ============================================================
-- ASSIGNMENTS TABLE - Add FK to COURSES
-- ============================================================

-- Check if constraint exists and drop if it does
ALTER TABLE IF EXISTS public.assignments
DROP CONSTRAINT IF EXISTS assignments_course_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.assignments
ADD CONSTRAINT assignments_course_id_fkey
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- ============================================================
-- COURSE_ENROLLMENTS TABLE - Add FK to COURSES
-- ============================================================

-- Check if constraint exists and drop if it does
ALTER TABLE IF EXISTS public.course_enrollments
DROP CONSTRAINT IF EXISTS course_enrollments_course_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.course_enrollments
ADD CONSTRAINT course_enrollments_course_id_fkey
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- ============================================================
-- COURSE_ENROLLMENTS TABLE - Add FK to PROFILES (students)
-- ============================================================

-- Check if constraint exists and drop if it does
ALTER TABLE IF EXISTS public.course_enrollments
DROP CONSTRAINT IF EXISTS course_enrollments_student_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.course_enrollments
ADD CONSTRAINT course_enrollments_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- ASSIGNMENTS TABLE - Add FK to PROFILES (if needed)
-- ============================================================

-- Check if assignments has created_by column and add FK if needed
ALTER TABLE IF EXISTS public.assignments
DROP CONSTRAINT IF EXISTS assignments_created_by_fkey;

-- ============================================================
-- ASSIGNMENT_SUBMISSIONS TABLE - Add FKs
-- ============================================================

-- Add FK to assignments table
ALTER TABLE IF EXISTS public.assignment_submissions
DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;

ALTER TABLE IF EXISTS public.assignment_submissions
ADD CONSTRAINT assignment_submissions_assignment_id_fkey
FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

-- Add FK to profiles table (student who submitted)
ALTER TABLE IF EXISTS public.assignment_submissions
DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

ALTER TABLE IF EXISTS public.assignment_submissions
ADD CONSTRAINT assignment_submissions_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================
-- COURSES TABLE - Add FK to FACULTY (instructor)
-- ============================================================

-- Add FK to faculty table
ALTER TABLE IF EXISTS public.courses
DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

ALTER TABLE IF EXISTS public.courses
ADD CONSTRAINT courses_instructor_id_fkey
FOREIGN KEY (instructor_id) REFERENCES public.faculty(id) ON DELETE SET NULL;

-- ============================================================
-- VERIFY FOREIGN KEYS
-- ============================================================

-- List all foreign keys in our tables
SELECT 
    rc.constraint_name,
    kcu.table_name,
    kcu.column_name,
    rkcu.table_name as foreign_table_name,
    rkcu.column_name as foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
  AND rc.constraint_schema = kcu.table_schema
JOIN information_schema.key_column_usage rkcu ON rc.unique_constraint_name = rkcu.constraint_name
  AND rc.constraint_schema = rkcu.table_schema
WHERE rc.constraint_schema = 'public'
AND kcu.table_name IN ('assignments', 'course_enrollments', 'courses', 'assignment_submissions')
ORDER BY kcu.table_name, rc.constraint_name;
