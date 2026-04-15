-- ============================================================
-- POST-DEPLOYMENT VALIDATION QUERIES
-- ============================================================
-- Run these queries AFTER deploying the RLS fix to verify
-- that faculty members can only see their assigned courses
-- ============================================================

-- ============================================================
-- TEST 1: Check your profile details
-- ============================================================

SELECT 
    '1. Your Profile' as test,
    p.email,
    p.role,
    p.user_type,
    p.full_name,
    CASE 
        WHEN p.role = 'admin' THEN '→ Admin role (should see all courses)'
        WHEN p.role = 'faculty' THEN '→ Faculty role (should see only assigned courses)'
        WHEN p.role = 'student' THEN '→ Student role (should see enrolled courses)'
        ELSE '→ Other role: ' || p.role
    END as expected_access
FROM public.profiles p
WHERE p.id = auth.uid();

-- ============================================================
-- TEST 2: Check if is_user_admin() returns correct value
-- ============================================================

SELECT 
    '2. Admin Function Test' as test,
    public.is_user_admin() as function_returns,
    CASE 
        WHEN public.is_user_admin() THEN '❌ Returns TRUE - You are identified as admin'
        ELSE '✅ Returns FALSE - You are NOT identified as admin'
    END as result,
    CASE
        WHEN public.is_user_admin() AND (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' 
          THEN '⚠️ BUG: Non-admin user identified as admin!'
        WHEN public.is_user_admin() AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
          THEN '✅ Correct: Admin user identified as admin'
        WHEN NOT public.is_user_admin() AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
          THEN '❌ BUG: Admin user NOT identified as admin!'
        ELSE '✅ Correct: Non-admin user NOT identified as admin'
    END as validation
FROM public.profiles
WHERE id = auth.uid();

-- ============================================================
-- TEST 3: Check faculty linkage
-- ============================================================

SELECT 
    '3. Faculty Linkage' as test,
    f.id as faculty_id,
    f.profile_id,
    f.name,
    f.email,
    auth.uid() as your_auth_id,
    CASE 
        WHEN f.profile_id = auth.uid() THEN '✅ LINKED'
        ELSE '❌ NOT LINKED'
    END as link_status
FROM public.faculty f
WHERE f.profile_id = auth.uid()
   OR f.email = (SELECT email FROM public.profiles WHERE id = auth.uid());

-- ============================================================
-- TEST 4: Check get_current_faculty_id() function
-- ============================================================

SELECT 
    '4. Faculty ID Function' as test,
    public.get_current_faculty_id() as function_returns_faculty_id,
    (SELECT id FROM public.faculty WHERE profile_id = auth.uid()) as expected_faculty_id,
    CASE 
        WHEN public.get_current_faculty_id() IS NULL THEN '❌ Returns NULL - linkage problem'
        WHEN public.get_current_faculty_id() = (SELECT id FROM public.faculty WHERE profile_id = auth.uid())
          THEN '✅ Returns correct faculty ID'
        ELSE '⚠️ Returns ID but does not match expected value'
    END as validation;

-- ============================================================
-- TEST 5: Count courses visible via RLS
-- ============================================================

SELECT 
    '5. Course Visibility' as test,
    COUNT(*) as courses_visible,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No courses visible - RLS too restrictive or no courses assigned'
        WHEN COUNT(*) = 1 THEN '✅ ONE course visible - Correct for Dr. Turner'
        WHEN COUNT(*) > 1 AND COUNT(*) < 10 
          THEN '⚠️ Multiple courses - Check if faculty teaches multiple courses'
        WHEN COUNT(*) >= 50 
          THEN '❌ Seeing all courses - RLS FIX DID NOT WORK!'
        ELSE '⚠️ Unusual count: ' || COUNT(*)::TEXT
    END as result
FROM public.courses;

-- ============================================================
-- TEST 6: List all visible courses
-- ============================================================

SELECT 
    '6. Your Visible Courses' as test,
    c.code,
    c.name,
    c.total_students,
    c.instructor_id,
    CASE 
        WHEN c.instructor_id = public.get_current_faculty_id() 
          THEN '✅ You are instructor'
        ELSE '⚠️ Not your course - visible due to admin policy?'
    END as reason_visible
FROM public.courses c
ORDER BY c.code;

-- ============================================================
-- TEST 7: Check which RLS policies are applied
-- ============================================================

SELECT 
    '7. Active RLS Policies' as test,
    policyname,
    cmd,
    permissive,
    qual::text as policy_condition
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'courses'
ORDER BY policyname;

-- ============================================================
-- TEST 8: Test each RLS policy individually
-- ============================================================

-- Test instructor policy
WITH policy_test AS (
    SELECT 
        instructor_id = public.get_current_faculty_id() as instructor_policy_matches,
        public.is_user_admin() as admin_policy_matches
    FROM public.courses
)
SELECT 
    '8. Policy Match Analysis' as test,
    COUNT(*) FILTER (WHERE instructor_policy_matches) as courses_via_instructor_policy,
    COUNT(*) FILTER (WHERE admin_policy_matches) as courses_via_admin_policy,
    COUNT(*) FILTER (WHERE instructor_policy_matches OR admin_policy_matches) as total_visible,
    CASE 
        WHEN COUNT(*) FILTER (WHERE admin_policy_matches) > 0 
          THEN '❌ Admin policy is matching - RLS bug still exists'
        WHEN COUNT(*) FILTER (WHERE instructor_policy_matches) = 1
          THEN '✅ Only instructor policy matching - CORRECT'
        WHEN COUNT(*) FILTER (WHERE instructor_policy_matches) = 0
          THEN '❌ Instructor policy not matching - linkage issue'
        ELSE '⚠️ Multiple instructor matches - check data'
    END as diagnosis
FROM policy_test;

-- ============================================================
-- TEST 9: Check RLS is enabled on courses table
-- ============================================================

SELECT 
    '9. RLS Status' as test,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS is ENABLED'
        ELSE '❌ RLS is DISABLED - this is why faculty see all courses!'
    END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'courses';

-- ============================================================
-- TEST 10: Comprehensive summary
-- ============================================================

DO $$
DECLARE
    v_role TEXT;
    v_user_type TEXT;
    v_is_admin BOOLEAN;
    v_faculty_id UUID;
    v_courses_count INT;
    v_rls_enabled BOOLEAN;
BEGIN
    -- Gather all data
    SELECT role, user_type INTO v_role, v_user_type 
    FROM public.profiles WHERE id = auth.uid();
    
    v_is_admin := public.is_user_admin();
    v_faculty_id := public.get_current_faculty_id();
    
    SELECT COUNT(*) INTO v_courses_count FROM public.courses;
    
    SELECT rowsecurity INTO v_rls_enabled 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'courses';
    
    -- Print comprehensive report
    RAISE NOTICE '============================================================';
    RAISE NOTICE '                 VALIDATION SUMMARY';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'PROFILE:';
    RAISE NOTICE '  Role: %', v_role;
    RAISE NOTICE '  User Type: %', v_user_type;
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCTIONS:';
    RAISE NOTICE '  is_user_admin(): %', v_is_admin;
    RAISE NOTICE '  get_current_faculty_id(): %', COALESCE(v_faculty_id::TEXT, 'NULL');
    RAISE NOTICE '';
    RAISE NOTICE 'COURSE ACCESS:';
    RAISE NOTICE '  Courses visible: %', v_courses_count;
    RAISE NOTICE '  RLS enabled: %', v_rls_enabled;
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '                 DIAGNOSIS';
    RAISE NOTICE '============================================================';
    
    -- Diagnose issues
    IF NOT v_rls_enabled THEN
        RAISE NOTICE '❌ CRITICAL: RLS is DISABLED on courses table!';
        RAISE NOTICE '   → Enable with: ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;';
    ELSIF v_role = 'faculty' AND v_is_admin THEN
        RAISE NOTICE '❌ CRITICAL: Faculty member identified as admin!';
        RAISE NOTICE '   → The is_user_admin() fix did not work';
        RAISE NOTICE '   → Check function definition';
    ELSIF v_role = 'faculty' AND v_faculty_id IS NULL THEN
        RAISE NOTICE '❌ CRITICAL: get_current_faculty_id() returns NULL!';
        RAISE NOTICE '   → Faculty record not linked to profile';
        RAISE NOTICE '   → Check faculty.profile_id matches auth.uid()';
    ELSIF v_role = 'faculty' AND v_courses_count = 1 THEN
        RAISE NOTICE '✅ SUCCESS: All systems working correctly!';
        RAISE NOTICE '   → Faculty sees only their 1 assigned course';
        RAISE NOTICE '   → RLS is properly restricting access';
    ELSIF v_role = 'faculty' AND v_courses_count > 1 AND v_courses_count < 10 THEN
        RAISE NOTICE '⚠️  INFO: Faculty sees % courses', v_courses_count;
        RAISE NOTICE '   → This may be correct if faculty teaches multiple courses';
    ELSIF v_role = 'faculty' AND v_courses_count >= 50 THEN
        RAISE NOTICE '❌ CRITICAL: Faculty sees all courses in database!';
        RAISE NOTICE '   → RLS policies are not working';
        RAISE NOTICE '   → Check policy definitions and function logic';
    ELSIF v_role = 'admin' THEN
        RAISE NOTICE '✅ INFO: You are admin - seeing all courses is expected';
    ELSE
        RAISE NOTICE '⚠️  UNKNOWN: Review results manually';
    END IF;
    
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- VALIDATION COMPLETE
-- ============================================================

SELECT '📋 VALIDATION TESTS COMPLETE - Review all results above' as status;
