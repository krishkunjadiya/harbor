-- ============================================================
-- EMERGENCY FIX: Faculty Seeing All Courses
-- ============================================================
-- Issue: get_current_faculty_id() returns NULL
--        AND there's a permissive policy allowing all access

-- ============================================================
-- STEP 1: Diagnose the faculty ID issue
-- ============================================================

-- Check your auth and faculty connection
SELECT 
    'Connection Test' as test,
    auth.uid() as your_auth_id,
    (SELECT id FROM public.faculty WHERE profile_id = auth.uid()) as your_faculty_id,
    (SELECT email FROM public.faculty WHERE profile_id = auth.uid()) as faculty_email,
    public.get_current_faculty_id() as function_returns;

-- ============================================================
-- STEP 2: Check ALL RLS policies on courses
-- ============================================================

SELECT 
    'All Course Policies' as check,
    policyname,
    cmd,
    permissive,
    qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'courses'
ORDER BY policyname;

-- ============================================================
-- STEP 3: DROP ALL PERMISSIVE POLICIES
-- ============================================================

-- Remove ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies 
              WHERE schemaname = 'public' AND tablename = 'courses')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================================
-- STEP 4: Fix the get_current_faculty_id function
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    faculty_uuid UUID;
BEGIN
    -- Get faculty ID for current authenticated user
    SELECT id INTO faculty_uuid
    FROM public.faculty 
    WHERE profile_id = auth.uid()
    LIMIT 1;
    
    -- Debug logging
    IF faculty_uuid IS NULL THEN
        RAISE WARNING 'get_current_faculty_id returned NULL for auth.uid: %', auth.uid();
    END IF;
    
    RETURN faculty_uuid;
END;
$$;

-- ============================================================
-- STEP 5: Create STRICT RLS policies
-- ============================================================

-- Policy 1: Faculty can ONLY see courses they instruct
CREATE POLICY "courses_faculty_own_only"
ON public.courses
FOR SELECT
USING (
    -- Direct comparison - no complex queries
    instructor_id IN (
        SELECT id FROM public.faculty WHERE profile_id = auth.uid()
    )
);

-- Policy 2: Students can see enrolled courses
CREATE POLICY "courses_students_enrolled"
ON public.courses
FOR SELECT
USING (
    id IN (
        SELECT course_id FROM public.course_enrollments 
        WHERE student_id = auth.uid()
    )
);

-- Policy 3: TRUE ADMINS ONLY (role='admin', not user_type)
CREATE POLICY "courses_admin_only"
ON public.courses
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    )
);

-- ============================================================
-- STEP 6: Verify faculty record exists and is linked
-- ============================================================

-- Check if your profile_id matches
SELECT 
    'Faculty Link Check' as check,
    f.id as faculty_id,
    f.profile_id,
    f.email,
    f.name,
    auth.uid() as your_auth_id,
    CASE 
        WHEN f.profile_id = auth.uid() THEN '✓ LINKED'
        ELSE '✗ NOT LINKED'
    END as status
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- If not linked, fix it
DO $$
DECLARE
    v_faculty_id UUID;
    v_auth_id UUID;
BEGIN
    v_auth_id := auth.uid();
    
    -- Check if faculty record exists but profile_id is wrong
    SELECT id INTO v_faculty_id
    FROM public.faculty
    WHERE email = 'dr.jeffrey.turner@harbor.edu';
    
    IF v_faculty_id IS NOT NULL THEN
        -- Update the profile_id
        UPDATE public.faculty
        SET profile_id = v_auth_id
        WHERE email = 'dr.jeffrey.turner@harbor.edu'
        AND (profile_id IS NULL OR profile_id != v_auth_id);
        
        RAISE NOTICE 'Updated faculty profile_id to: %', v_auth_id;
    ELSE
        RAISE NOTICE 'No faculty record found for dr.jeffrey.turner@harbor.edu';
    END IF;
END $$;

-- ============================================================
-- STEP 7: Test the fix
-- ============================================================

-- Test function now
SELECT 
    'Function Test After Fix' as test,
    public.get_current_faculty_id() as my_faculty_id,
    CASE 
        WHEN public.get_current_faculty_id() IS NULL THEN '❌ STILL NULL'
        ELSE '✓ Returns: ' || public.get_current_faculty_id()::text
    END as result;

-- Count visible courses
SELECT 
    'Courses Visible Now' as test,
    COUNT(*) as total_visible,
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ FIXED - Seeing only SE301'
        WHEN COUNT(*) = 0 THEN '❌ Seeing nothing - policy too restrictive'
        ELSE '❌ Still seeing ' || COUNT(*)::text || ' courses'
    END as status
FROM public.courses;

-- Show which courses you can see
SELECT 
    'Your Courses After Fix' as test,
    c.code,
    c.name,
    c.instructor_id,
    f.name as instructor
FROM public.courses c
LEFT JOIN public.faculty f ON c.instructor_id = f.id
ORDER BY c.code;

-- ============================================================
-- STEP 8: Detailed diagnosis if still not working
-- ============================================================

DO $$
DECLARE
    v_auth_id UUID;
    v_faculty_id UUID;
    v_function_result UUID;
    v_courses_count INT;
    v_se301_instructor UUID;
BEGIN
    v_auth_id := auth.uid();
    v_function_result := public.get_current_faculty_id();
    
    SELECT id INTO v_faculty_id FROM public.faculty WHERE profile_id = v_auth_id;
    SELECT instructor_id INTO v_se301_instructor FROM public.courses WHERE code = 'SE301';
    SELECT COUNT(*) INTO v_courses_count FROM public.courses;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'COMPREHENSIVE DIAGNOSIS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '1. Your auth.uid(): %', v_auth_id;
    RAISE NOTICE '2. Your faculty.id from direct query: %', v_faculty_id;
    RAISE NOTICE '3. Function returns: %', v_function_result;
    RAISE NOTICE '4. SE301 instructor_id: %', v_se301_instructor;
    RAISE NOTICE '5. Courses you can see: %', v_courses_count;
    RAISE NOTICE '';
    
    IF v_faculty_id IS NULL THEN
        RAISE NOTICE '❌ PROBLEM: No faculty record with your auth ID';
        RAISE NOTICE '   Action: Faculty record needs profile_id updated';
    ELSIF v_function_result IS NULL THEN
        RAISE NOTICE '❌ PROBLEM: Function returns NULL';
        RAISE NOTICE '   Action: Check function definition';
    ELSIF v_faculty_id != v_se301_instructor THEN
        RAISE NOTICE '❌ PROBLEM: Your faculty ID doesnt match SE301 instructor';
        RAISE NOTICE '   Your faculty.id: %', v_faculty_id;
        RAISE NOTICE '   SE301 instructor_id: %', v_se301_instructor;
        RAISE NOTICE '   Action: Course assignment is wrong in database';
    ELSIF v_courses_count != 1 THEN
        RAISE NOTICE '❌ PROBLEM: RLS policy not working correctly';
        RAISE NOTICE '   Action: Check policy definitions';
    ELSE
        RAISE NOTICE '✅ ALL CHECKS PASSED - Should be working!';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;
