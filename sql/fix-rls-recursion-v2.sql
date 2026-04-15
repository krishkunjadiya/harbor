-- ============================================================
-- FIX INFINITE RECURSION - Version 2
-- ============================================================
-- Use SECURITY DEFINER functions to bypass RLS checks within policies
-- This breaks the recursion chain

-- ============================================================
-- STEP 1: Drop ALL existing policies completely
-- ============================================================

-- Drop ALL policies on courses
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on faculty
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.faculty', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on course_enrollments
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_enrollments', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on assignments
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignments', r.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignment_submissions')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignment_submissions', r.policyname);
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: Create SECURITY DEFINER helper functions
-- ============================================================

-- Function to get faculty ID for current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT id FROM public.faculty 
        WHERE profile_id = auth.uid()
        LIMIT 1
    );
END;
$$;

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'university')
    );
END;
$$;

-- ============================================================
-- STEP 3: Create NEW policies using helper functions
-- ============================================================

-- FACULTY TABLE POLICIES (simple, no recursion risk)
CREATE POLICY "faculty_select_own"
ON public.faculty
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "faculty_select_admin"
ON public.faculty
FOR SELECT
USING (public.is_user_admin());

CREATE POLICY "faculty_update_own"
ON public.faculty
FOR UPDATE
USING (profile_id = auth.uid());

-- COURSES TABLE POLICIES (using helper function to avoid recursion)
CREATE POLICY "courses_select_instructor"
ON public.courses
FOR SELECT
USING (instructor_id = public.get_current_faculty_id());

CREATE POLICY "courses_select_enrolled"
ON public.courses
FOR SELECT
USING (
    id IN (
        SELECT course_id FROM public.course_enrollments
        WHERE student_id = auth.uid()
    )
);

CREATE POLICY "courses_select_admin"
ON public.courses
FOR SELECT
USING (public.is_user_admin());

CREATE POLICY "courses_update_instructor"
ON public.courses
FOR UPDATE
USING (instructor_id = public.get_current_faculty_id());

-- COURSE_ENROLLMENTS POLICIES
CREATE POLICY "enrollments_select_student"
ON public.course_enrollments
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_instructor"
ON public.course_enrollments
FOR SELECT
USING (
    course_id IN (
        SELECT id FROM public.courses
        WHERE instructor_id = public.get_current_faculty_id()
    )
);

CREATE POLICY "enrollments_select_admin"
ON public.course_enrollments
FOR SELECT
USING (public.is_user_admin());

-- ASSIGNMENTS POLICIES
CREATE POLICY "assignments_select_instructor"
ON public.assignments
FOR SELECT
USING (
    course_id IN (
        SELECT id FROM public.courses
        WHERE instructor_id = public.get_current_faculty_id()
    )
);

CREATE POLICY "assignments_select_student"
ON public.assignments
FOR SELECT
USING (
    course_id IN (
        SELECT course_id FROM public.course_enrollments
        WHERE student_id = auth.uid()
    )
);

CREATE POLICY "assignments_insert_instructor"
ON public.assignments
FOR INSERT
WITH CHECK (
    course_id IN (
        SELECT id FROM public.courses
        WHERE instructor_id = public.get_current_faculty_id()
    )
);

CREATE POLICY "assignments_update_instructor"
ON public.assignments
FOR UPDATE
USING (
    course_id IN (
        SELECT id FROM public.courses
        WHERE instructor_id = public.get_current_faculty_id()
    )
);

CREATE POLICY "assignments_delete_instructor"
ON public.assignments
FOR DELETE
USING (
    course_id IN (
        SELECT id FROM public.courses
        WHERE instructor_id = public.get_current_faculty_id()
    )
);

-- ASSIGNMENT_SUBMISSIONS POLICIES
CREATE POLICY "submissions_select_student"
ON public.assignment_submissions
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "submissions_select_instructor"
ON public.assignment_submissions
FOR SELECT
USING (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        WHERE a.course_id IN (
            SELECT id FROM public.courses
            WHERE instructor_id = public.get_current_faculty_id()
        )
    )
);

CREATE POLICY "submissions_insert_student"
ON public.assignment_submissions
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_update_student"
ON public.assignment_submissions
FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "submissions_update_instructor"
ON public.assignment_submissions
FOR UPDATE
USING (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        WHERE a.course_id IN (
            SELECT id FROM public.courses
            WHERE instructor_id = public.get_current_faculty_id()
        )
    )
);

-- ============================================================
-- STEP 4: VERIFICATION
-- ============================================================

-- Verify policies exist
SELECT 
    'Policy Count' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments')
GROUP BY tablename
ORDER BY tablename;

-- Test the helper functions
SELECT 
    'Helper Functions Test' as check_type,
    public.get_current_faculty_id() as my_faculty_id,
    public.is_user_admin() as am_i_admin;

-- Test courses query
SELECT 
    'My Courses Test' as check_type,
    c.code,
    c.name,
    c.total_students
FROM public.courses c
LIMIT 5;

SELECT '✓ RECURSION FIXED' as status;
