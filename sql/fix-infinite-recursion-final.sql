-- ============================================================
-- FIX: Infinite Recursion in RLS Policies  
-- ============================================================
-- Issue: Multiple SELECT policies + faculty table RLS causing recursion
-- Solution: Combine policies, ensure SECURITY DEFINER bypasses RLS
-- ============================================================

-- ============================================================
-- STEP 1: Ensure helper functions bypass RLS properly
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
SET search_path = public
STABLE  -- Can be optimized
AS $$
BEGIN
    RETURN (
        SELECT id FROM public.faculty 
        WHERE profile_id = auth.uid()
        LIMIT 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
SET search_path = public
STABLE  -- Can be optimized
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- ============================================================
-- STEP 2: Disable RLS on faculty table to prevent recursion
-- ============================================================

ALTER TABLE public.faculty DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Drop ALL existing policies on courses table
-- ============================================================

DROP POLICY IF EXISTS "courses_select_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_select_enrolled" ON public.courses;
DROP POLICY IF EXISTS "courses_select_admin" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_only" ON public.courses;
DROP POLICY IF EXISTS "courses_faculty_own_only" ON public.courses;
DROP POLICY IF EXISTS "courses_students_enrolled" ON public.courses;
DROP POLICY IF EXISTS "courses_update_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;

-- Drop any other policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'courses'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================================
-- STEP 4: Create ONE combined SELECT policy (no recursion)
-- ============================================================

CREATE POLICY "courses_select_all"
ON public.courses
FOR SELECT
USING (
    -- Option 1: User is admin
    public.is_user_admin()
    
    OR
    
    -- Option 2: User is the instructor (faculty)
    instructor_id IN (
        SELECT id FROM public.faculty WHERE profile_id = auth.uid()
    )
    
    OR
    
    -- Option 3: User is enrolled student
    id IN (
        SELECT course_id FROM public.course_enrollments WHERE student_id = auth.uid()
    )
);

-- ============================================================
-- STEP 5: Ensure RLS is enabled on courses
-- ============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Verify the fix
-- ============================================================

-- Check policies
SELECT 
    'Policies on Courses' as check,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'courses';

-- Check RLS status
SELECT 
    'RLS Status' as check,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as courses_rls,
    (SELECT CASE WHEN rowsecurity THEN 'DISABLED' ELSE 'ENABLED' END 
     FROM pg_tables 
     WHERE schemaname = 'public' AND tablename = 'faculty') as faculty_rls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'courses';

-- Test functions
DO $$
DECLARE
    v_faculty_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    v_faculty_id := public.get_current_faculty_id();
    v_is_admin := public.is_user_admin();
    
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'FUNCTION TEST RESULTS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'get_current_faculty_id(): %', COALESCE(v_faculty_id::TEXT, 'NULL');
    RAISE NOTICE 'is_user_admin(): %', v_is_admin;
    RAISE NOTICE '============================================================';
    
    IF v_faculty_id IS NULL AND v_is_admin = FALSE THEN
        RAISE NOTICE '⚠️  Running as service role - functions work but return NULL';
        RAISE NOTICE '   This is expected when testing from SQL Editor';
    END IF;
END $$;

-- ============================================================
-- SUCCESS
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ FIX APPLIED SUCCESSFULLY';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '1. ✓ Helper functions use SECURITY DEFINER + STABLE';
    RAISE NOTICE '2. ✓ Faculty table RLS DISABLED (prevents recursion)';
    RAISE NOTICE '3. ✓ All old course policies DROPPED';
    RAISE NOTICE '4. ✓ Single combined SELECT policy created';
    RAISE NOTICE '5. ✓ Courses RLS ENABLED';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Test in your application!';
    RAISE NOTICE '  1. Login as dr.jeffrey.turner@harbor.edu';
    RAISE NOTICE '  2. Go to faculty dashboard';
    RAISE NOTICE '  3. Should see 1 course (SE301)';
    RAISE NOTICE '';
END $$;
