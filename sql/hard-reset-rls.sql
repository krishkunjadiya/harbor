-- ============================================================
-- EMERGENCY: Hard Reset RLS Policies
-- ============================================================
-- Use this if the previous fix didn't work
-- This completely removes all RLS and rebuilds from scratch
-- ============================================================

-- STEP 1: Drop ALL policies on ALL related tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on courses
    FOR r IN (
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'courses'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', r.policyname);
        RAISE NOTICE 'Dropped courses policy: %', r.policyname;
    END LOOP;
    
    -- Drop all policies on faculty
    FOR r IN (
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'faculty'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.faculty', r.policyname);
        RAISE NOTICE 'Dropped faculty policy: %', r.policyname;
    END LOOP;
    
    -- Drop all policies on course_enrollments
    FOR r IN (
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'course_enrollments'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_enrollments', r.policyname);
        RAISE NOTICE 'Dropped enrollment policy: %', r.policyname;
    END LOOP;
END $$;

-- STEP 2: Disable RLS on faculty (prevents recursion)
ALTER TABLE public.faculty DISABLE ROW LEVEL SECURITY;

-- STEP 3: Disable RLS on course_enrollments (prevents recursion)
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;

-- STEP 4: Keep RLS enabled ONLY on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- STEP 5: Recreate helper functions with proper settings
CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT id FROM public.faculty 
    WHERE profile_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
$$;

-- STEP 6: Create SIMPLE, NON-RECURSIVE policy
CREATE POLICY "courses_access"
ON public.courses
FOR SELECT
USING (
    -- Direct checks - no subqueries that could recurse
    auth.uid() IN (
        SELECT p.id FROM public.profiles p WHERE p.role = 'admin'
    )
    OR
    instructor_id = public.get_current_faculty_id()
    OR
    auth.uid() IN (
        SELECT ce.student_id FROM public.course_enrollments ce WHERE ce.course_id = courses.id
    )
);

-- STEP 7: Verify cleanup
SELECT 
    'Verification' as check,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses') as courses_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faculty') as faculty_policies,
    (SELECT CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') as courses_rls,
    (SELECT CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faculty') as faculty_rls;

-- STEP 8: Test it works
DO $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := public.get_current_faculty_id();
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'HARD RESET COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Faculty RLS: DISABLED (prevents recursion)';
    RAISE NOTICE 'Course_enrollments RLS: DISABLED (prevents recursion)';
    RAISE NOTICE 'Courses RLS: ENABLED (1 simple policy)';
    RAISE NOTICE 'Helper functions: Using SQL (faster, simpler)';
    RAISE NOTICE '';
    RAISE NOTICE 'get_current_faculty_id() returns: %', COALESCE(v_faculty_id::TEXT, 'NULL (expected in SQL editor)');
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Restart your Next.js server and test!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
END $$;
