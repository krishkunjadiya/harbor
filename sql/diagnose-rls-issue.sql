-- Diagnose why Dr. Turner can see all 50 courses instead of just his 1 course
-- Run this in Supabase SQL Editor while logged in as Dr. Turner

-- 1. Check your role/admin status
SELECT 
    'Your Profile Info' as check,
    p.email,
    p.role,
    p.user_type,
    CASE 
        WHEN p.role IN ('admin', 'university') THEN 'Admin Access'
        WHEN p.user_type IN ('admin', 'university') THEN 'University Access'
        ELSE 'Regular Faculty'
    END as access_level
FROM public.profiles p
WHERE p.id = auth.uid();

-- 2. Test the helper function
SELECT 
    'Helper Function Result' as check,
    public.get_current_faculty_id() as my_faculty_id,
    public.is_user_admin() as am_i_admin;

-- 3. Check current RLS policies on courses
SELECT 
    'Courses RLS Policies' as check,
    policyname,
    cmd,
    permissive,
    LEFT(qual::text, 100) as policy_condition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'courses'
ORDER BY policyname;

-- 4. Check which policy is matching
SELECT 
    'Policy Match Test' as check,
    'Testing each condition...' as note;

-- Test 1: Am I the instructor?
SELECT 
    'Test 1: Instructor Check' as test,
    COUNT(*) as my_courses_as_instructor
FROM public.courses
WHERE instructor_id = public.get_current_faculty_id();

-- Test 2: Am I an admin?
SELECT 
    'Test 2: Admin Check' as test,
    public.is_user_admin() as admin_status,
    CASE 
        WHEN public.is_user_admin() THEN 'YES - This is why you see all courses!'
        ELSE 'NO'
    END as explanation;

-- Test 3: Check profiles table for admin role
SELECT 
    'Test 3: Direct Role Check' as test,
    p.role,
    p.user_type,
    CASE 
        WHEN p.role IN ('admin', 'university') THEN 'ADMIN ROLE - Sees all courses'
        WHEN p.user_type IN ('admin', 'university') THEN 'UNIVERSITY TYPE - Sees all courses'
        ELSE 'REGULAR FACULTY - Should see only own'
    END as why_seeing_all
FROM public.profiles p
WHERE p.id = auth.uid();

-- 5. Show breakdown of what you can see
SELECT 
    'Course Visibility Breakdown' as check,
    COUNT(*) FILTER (WHERE instructor_id = public.get_current_faculty_id()) as my_courses_count,
    COUNT(*) FILTER (WHERE instructor_id != public.get_current_faculty_id()) as other_faculty_courses,
    COUNT(*) as total_visible
FROM public.courses;

-- 6. Recommendation
DO $$
DECLARE
    v_is_admin BOOLEAN;
    v_role TEXT;
    v_user_type TEXT;
BEGIN
    SELECT 
        public.is_user_admin(),
        p.role,
        p.user_type
    INTO v_is_admin, v_role, v_user_type
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RLS DIAGNOSIS RESULTS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Admin Function Result: %', v_is_admin;
    RAISE NOTICE 'Your Role: %', v_role;
    RAISE NOTICE 'Your User Type: %', v_user_type;
    RAISE NOTICE '';
    
    IF v_is_admin OR v_role IN ('admin', 'university') OR v_user_type IN ('admin', 'university') THEN
        RAISE NOTICE '❌ ISSUE FOUND:';
        RAISE NOTICE '   You have admin/university privileges!';
        RAISE NOTICE '   This causes you to see ALL courses (50 total)';
        RAISE NOTICE '';
        RAISE NOTICE '📋 EXPLANATION:';
        RAISE NOTICE '   Faculty members need user_type="university" for authentication';
        RAISE NOTICE '   BUT the RLS policy "courses_select_admin" is matching this';
        RAISE NOTICE '   and showing you ALL courses instead of just yours.';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 FIX NEEDED:';
        RAISE NOTICE '   The RLS policy needs to distinguish between:';
        RAISE NOTICE '   - University ADMIN (sees all courses)';
        RAISE NOTICE '   - University FACULTY (sees only their courses)';
        RAISE NOTICE '';
        RAISE NOTICE '   Current policy checks: user_type IN ("admin", "university")';
        RAISE NOTICE '   Should check: role IN ("admin") only';
    ELSE
        RAISE NOTICE '✓ No admin privileges found';
        RAISE NOTICE '   Need to investigate further...';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;
