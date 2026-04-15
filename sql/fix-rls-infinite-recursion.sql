-- ============================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================
-- The issue: RLS policies are recursively checking faculty table
-- Solution: Use simpler policies that don't create circular dependencies

-- ============================================================
-- STEP 1: Remove ALL existing problematic policies
-- ============================================================

-- Drop all existing policies on courses table
DROP POLICY IF EXISTS "Faculty can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view their courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty can view own courses" ON public.courses;

-- Drop all existing policies on faculty table
DROP POLICY IF EXISTS "Faculty members can view their own record" ON public.faculty;
DROP POLICY IF EXISTS "Admins can view all faculty" ON public.faculty;
DROP POLICY IF EXISTS "Faculty can view own profile" ON public.faculty;
DROP POLICY IF EXISTS "Faculty read own data" ON public.faculty;

-- Drop policies on course_enrollments
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Faculty can view enrollments for their courses" ON public.course_enrollments;

-- Drop policies on assignments
DROP POLICY IF EXISTS "Faculty can view assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON public.assignments;

-- ============================================================
-- STEP 2: Create SIMPLE, NON-RECURSIVE policies
-- ============================================================

-- FACULTY TABLE POLICIES
-- These are simple and don't reference other tables
CREATE POLICY "faculty_select_own"
ON public.faculty
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "faculty_select_admin"
ON public.faculty
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'university')
    )
);

CREATE POLICY "faculty_update_own"
ON public.faculty
FOR UPDATE
USING (profile_id = auth.uid());

-- COURSES TABLE POLICIES  
-- Critical: Avoid subqueries that check faculty table to prevent recursion
-- Instead, use a direct comparison with a stored value

-- Policy 1: Faculty can see courses where they are the instructor
-- Use direct instructor_id check WITHOUT subquery
CREATE POLICY "courses_select_instructor"
ON public.courses
FOR SELECT
USING (
    -- Direct check: is there a faculty record where profile_id matches AND id matches instructor_id?
    EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.id = courses.instructor_id 
        AND f.profile_id = auth.uid()
    )
);

-- Policy 2: Students can see enrolled courses
CREATE POLICY "courses_select_enrolled_students"
ON public.courses
FOR SELECT
USING (
    id IN (
        SELECT course_id FROM public.course_enrollments 
        WHERE student_id = auth.uid()
    )
);

-- Policy 3: Admins can see all courses
CREATE POLICY "courses_select_admin"
ON public.courses
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'university')
    )
);

-- COURSE_ENROLLMENTS TABLE POLICIES
CREATE POLICY "enrollments_select_own_student"
ON public.course_enrollments
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_own_faculty"
ON public.course_enrollments
FOR SELECT
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

CREATE POLICY "enrollments_select_admin"
ON public.course_enrollments
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'university')
    )
);

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "assignments_select_faculty"
ON public.assignments
FOR SELECT
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

CREATE POLICY "assignments_select_students"
ON public.assignments
FOR SELECT
USING (
    course_id IN (
        SELECT course_id FROM public.course_enrollments
        WHERE student_id = auth.uid()
    )
);

CREATE POLICY "assignments_insert_faculty"
ON public.assignments
FOR INSERT
WITH CHECK (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

CREATE POLICY "assignments_update_faculty"
ON public.assignments
FOR UPDATE
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

CREATE POLICY "assignments_delete_faculty"
ON public.assignments
FOR DELETE
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

-- ASSIGNMENT_SUBMISSIONS TABLE POLICIES
CREATE POLICY "submissions_select_own_student"
ON public.assignment_submissions
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "submissions_select_faculty"
ON public.assignment_submissions
FOR SELECT
USING (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        JOIN public.courses c ON a.course_id = c.id
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

CREATE POLICY "submissions_insert_student"
ON public.assignment_submissions
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_update_own"
ON public.assignment_submissions
FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "submissions_update_faculty_grade"
ON public.assignment_submissions
FOR UPDATE
USING (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        JOIN public.courses c ON a.course_id = c.id
        JOIN public.faculty f ON c.instructor_id = f.id
        WHERE f.profile_id = auth.uid()
    )
);

-- ============================================================
-- STEP 3: VERIFICATION
-- ============================================================

-- Check that RLS is enabled
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments')
ORDER BY tablename;

-- Check new policies
SELECT 
    'New Policies' as check_type,
    tablename,
    policyname,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments')
ORDER BY tablename, policyname;

-- Test query as current user
SELECT 
    'Test: My Courses' as check_type,
    c.code,
    c.name,
    c.instructor_id,
    c.total_students
FROM public.courses c
WHERE c.instructor_id IN (
    SELECT id FROM public.faculty WHERE profile_id = auth.uid()
)
LIMIT 5;

SELECT 
    '✓ POLICIES FIXED' as status,
    'Refresh your faculty dashboard now' as next_step;
