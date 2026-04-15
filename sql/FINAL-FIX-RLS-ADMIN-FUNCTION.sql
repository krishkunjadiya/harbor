-- ============================================================
-- FINAL FIX: Faculty Seeing All Courses (RLS Admin Bug)
-- ============================================================
-- Issue: is_user_admin() checks user_type='university' which 
--        matches faculty members, granting them admin access
-- 
-- Fix: Change admin check to ONLY verify role='admin'
-- ============================================================

-- ============================================================
-- STEP 1: Recreate is_user_admin() with correct logic
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    -- Only return TRUE for users with role='admin'
    -- Do NOT check user_type (faculty have user_type='university')
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'  -- ONLY admins, not 'university' or other roles
    );
END;
$$;

COMMENT ON FUNCTION public.is_user_admin() IS 
'Returns TRUE only if the current user has role=admin. Does not check user_type to avoid matching faculty members who have user_type=university.';

-- ============================================================
-- STEP 2: Verify the fix worked
-- ============================================================

DO $$
DECLARE
    v_am_admin BOOLEAN;
    v_role TEXT;
    v_user_type TEXT;
    v_courses_visible INT;
BEGIN
    -- Get current user details
    SELECT role, user_type 
    INTO v_role, v_user_type
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Test the function
    v_am_admin := public.is_user_admin();
    
    -- Count visible courses
    SELECT COUNT(*) INTO v_courses_visible FROM public.courses;
    
    -- Output results
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FIX VERIFICATION RESULTS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Your Profile:';
    RAISE NOTICE '  - Role: %', v_role;
    RAISE NOTICE '  - User Type: %', v_user_type;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Function Result:';
    RAISE NOTICE '  - is_user_admin(): %', v_am_admin;
    RAISE NOTICE '';
    RAISE NOTICE 'Course Visibility:';
    RAISE NOTICE '  - Courses you can see: %', v_courses_visible;
    RAISE NOTICE '';
    
    -- Interpret results
    IF v_role = 'admin' AND v_am_admin AND v_courses_visible > 1 THEN
        RAISE NOTICE '✅ SUCCESS: You are admin - seeing all courses is correct';
    ELSIF v_role = 'faculty' AND NOT v_am_admin AND v_courses_visible = 1 THEN
        RAISE NOTICE '✅ SUCCESS: Faculty restriction working correctly';
        RAISE NOTICE '   You see only your assigned course(s)';
    ELSIF v_role = 'faculty' AND v_am_admin THEN
        RAISE NOTICE '❌ FAILURE: Faculty member incorrectly identified as admin';
        RAISE NOTICE '   The fix did not work - function still has bug';
    ELSIF v_role = 'faculty' AND v_courses_visible > 1 THEN
        RAISE NOTICE '❌ FAILURE: Faculty seeing multiple courses';
        RAISE NOTICE '   Check if there are other permissive policies';
    ELSE
        RAISE NOTICE '⚠️  UNKNOWN STATE';
        RAISE NOTICE '   Role: % | Admin: % | Courses: %', v_role, v_am_admin, v_courses_visible;
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================
-- STEP 3: Display visible courses
-- ============================================================

SELECT 
    'Courses you can now access' as check,
    c.code,
    c.name,
    c.total_students,
    c.status
FROM public.courses c
ORDER BY c.code;

-- ============================================================
-- STEP 4: Verify RLS policy still exists
-- ============================================================

SELECT 
    'RLS Policies on Courses' as check,
    policyname as policy_name,
    cmd as command,
    permissive,
    CASE 
        WHEN policyname = 'courses_select_admin' THEN '✓ Admin policy'
        WHEN policyname LIKE '%instructor%' THEN '✓ Faculty policy'
        WHEN policyname LIKE '%enrolled%' THEN '✓ Student policy'
        ELSE '? Unknown policy'
    END as description
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'courses'
ORDER BY policyname;

-- ============================================================
-- STEP 5: Show function definition
-- ============================================================

SELECT 
    'Updated Function Source' as check,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'is_user_admin';

-- ============================================================
-- SCRIPT COMPLETE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'DEPLOYMENT COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'The is_user_admin() function has been updated.';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results for Dr. Jeffrey Turner:';
    RAISE NOTICE '  - is_user_admin(): FALSE';
    RAISE NOTICE '  - Courses visible: 1';
    RAISE NOTICE '  - Course code: SE301';
    RAISE NOTICE '';
    RAISE NOTICE 'If results do not match expectations, check:';
    RAISE NOTICE '  1. Are there other RLS policies allowing access?';
    RAISE NOTICE '  2. Is RLS enabled on courses table?';
    RAISE NOTICE '  3. Is the faculty.profile_id correctly linked?';
    RAISE NOTICE '============================================================';
END $$;
