-- ============================================================
-- DR. JEFFREY TURNER - CURRENT DATA CHECK
-- ============================================================
-- Run this in Supabase SQL Editor while logged in as Dr. Turner
-- This shows what SHOULD be displaying vs what YOU are seeing

-- ============================================================
-- EXPECTED DATA FROM CSV FILES
-- ============================================================

-- Expected Profile:
-- Email: dr.jeffrey.turner@harbor.edu
-- Name: Dr. Jeffrey Turner
-- Profile ID: b1a1d1e1-1045-4000-8000-000000000145
-- User Type: university
-- Role: faculty

-- Expected Faculty Record:
-- Faculty ID: 0b506c4f-d819-44c4-af44-42cd667b3192
-- Position: Assistant Professor
-- Specialization: Teaching Excellence
-- Total Courses: 3
-- Total Students: 63
-- Status: active

-- Expected Courses:
-- 1. SE301 - Software Engineering (72/75 students)
-- (Plus 2 more courses based on total_courses=3)

-- ============================================================
-- SECTION 1: WHAT IS IN THE DATABASE NOW?
-- ============================================================

-- 1.1 Your Auth User
SELECT 
    '1. Your Auth User' as section,
    auth.uid() as your_auth_id,
    auth.email() as your_email;

-- 1.2 Your Profile Record
SELECT 
    '2. Your Profile' as section,
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.user_type,
    p.created_at
FROM public.profiles p
WHERE p.id = auth.uid()
   OR p.email = 'dr.jeffrey.turner@harbor.edu';

-- 1.3 Your Faculty Record
SELECT 
    '3. Your Faculty Record' as section,
    f.id as faculty_id,
    f.faculty_id as csv_faculty_id,
    f.profile_id,
    f.name,
    f.email,
    f.position,
    f.specialization,
    f.total_courses,
    f.total_students,
    f.status,
    CASE 
        WHEN f.profile_id = auth.uid() THEN '✓ LINKED'
        WHEN f.profile_id IS NULL THEN '✗ NO PROFILE_ID'
        ELSE '✗ WRONG PROFILE_ID'
    END as link_status
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- 1.4 Your Courses (What Database Says You Have)
SELECT 
    '4. Your Courses (Direct Query)' as section,
    c.id,
    c.code,
    c.name,
    c.instructor_id,
    c.total_students,
    c.max_students,
    c.semester,
    c.year,
    c.status,
    f.name as instructor_name,
    f.email as instructor_email
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu'
ORDER BY c.code;

-- 1.5 Your Courses (Via RLS - What App Should See)
SELECT 
    '5. Your Courses (Via RLS)' as section,
    c.code,
    c.name,
    c.total_students,
    c.max_students
FROM public.courses c
LIMIT 10;

-- ============================================================
-- SECTION 2: DASHBOARD DATA QUERY (Same as App)
-- ============================================================

-- 2.1 Get Faculty Profile (Step 1 of getFacultyDashboard)
SELECT 
    '6. Dashboard Step 1: Faculty Lookup' as section,
    f.id as faculty_id,
    f.name,
    f.email,
    f.profile_id,
    CASE 
        WHEN f.profile_id = auth.uid() THEN '✓ MATCH'
        ELSE '✗ MISMATCH'
    END as profile_match
FROM public.faculty f
WHERE f.profile_id = auth.uid();

-- 2.2 Get Courses (Step 2 of getFacultyDashboard)
DO $$
DECLARE
    v_faculty_id UUID;
BEGIN
    -- Get faculty ID
    SELECT id INTO v_faculty_id
    FROM public.faculty
    WHERE profile_id = auth.uid();

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Your Faculty ID: %', v_faculty_id;
    RAISE NOTICE '===========================================';
    
    -- Show courses query
    RAISE NOTICE 'Courses query will search for instructor_id = %', v_faculty_id;
END $$;

SELECT 
    '7. Dashboard Step 2: Courses Query' as section,
    c.*
FROM public.courses c
WHERE c.instructor_id IN (
    SELECT id FROM public.faculty WHERE profile_id = auth.uid()
);

-- ============================================================
-- SECTION 3: WHAT THE APP DISPLAYS
-- ============================================================

-- Dashboard Stats Display:
SELECT 
    '8. Dashboard Stats (What You See)' as section,
    COUNT(DISTINCT c.id) as "Active Courses (shows on dashboard)",
    COALESCE(SUM(c.total_students), 0) as "Total Students",
    0 as "Badges Issued",
    COALESCE(COUNT(a.id), 0) as "Pending Reviews"
FROM public.faculty f
LEFT JOIN public.courses c ON c.instructor_id = f.id
LEFT JOIN public.assignments a ON a.course_id = c.id
LEFT JOIN public.assignment_submissions sub ON sub.assignment_id = a.id AND sub.grade IS NULL
WHERE f.profile_id = auth.uid();

-- ============================================================
-- SECTION 4: DIAGNOSTICS - WHY IS IT NOT SHOWING?
-- ============================================================

-- 4.1 Check if auth.uid() matches anything
SELECT 
    '9. Auth UID Match Test' as section,
    auth.uid() as current_auth_id,
    (SELECT COUNT(*) FROM public.profiles WHERE id = auth.uid()) as profiles_match,
    (SELECT COUNT(*) FROM public.faculty WHERE profile_id = auth.uid()) as faculty_match,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.faculty WHERE profile_id = auth.uid()) > 0 THEN '✓ Connected'
        ELSE '✗ Not Connected'
    END as connection_status;

-- 4.2 Check RLS policies
SELECT 
    '10. RLS Policies on Courses' as section,
    policyname,
    cmd as command,
    permissive,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'courses'
ORDER BY policyname;

-- 4.3 Check if helper function exists
SELECT 
    '11. Helper Function Test' as section,
    public.get_current_faculty_id() as my_faculty_id,
    CASE 
        WHEN public.get_current_faculty_id() IS NOT NULL THEN '✓ Function Works'
        ELSE '✗ Function Returns NULL'
    END as function_status;

-- 4.4 Check for orphaned courses
SELECT 
    '12. Orphaned Courses Check' as section,
    c.code,
    c.name,
    c.instructor_id,
    f.name as instructor_name,
    CASE 
        WHEN f.id IS NULL THEN '✗ ORPHANED - No Faculty Found'
        WHEN f.profile_id IS NULL THEN '✗ Faculty Missing profile_id'
        ELSE '✓ OK'
    END as status
FROM public.courses c
LEFT JOIN public.faculty f ON c.instructor_id = f.id
WHERE c.instructor_id = '0b506c4f-d819-44c4-af44-42cd667b3192'
   OR f.email = 'dr.jeffrey.turner@harbor.edu';

-- ============================================================
-- SECTION 5: COMPARISON SUMMARY
-- ============================================================

SELECT 
    '13. COMPARISON SUMMARY' as section,
    '--- EXPECTED vs ACTUAL ---' as comparison;

-- Expected vs Actual
SELECT 
    'Expected (CSV)' as source,
    'dr.jeffrey.turner@harbor.edu' as email,
    'Dr. Jeffrey Turner' as name,
    'b1a1d1e1-1045-4000-8000-000000000145' as profile_id,
    '0b506c4f-d819-44c4-af44-42cd667b3192' as faculty_id,
    3 as total_courses,
    63 as total_students
UNION ALL
SELECT 
    'Actual (Database)' as source,
    f.email,
    f.name,
    f.profile_id::text,
    f.id::text as faculty_id,
    COALESCE(f.total_courses, 0),
    COALESCE(f.total_students, 0)
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- ============================================================
-- SECTION 6: ACTION ITEMS
-- ============================================================

DO $$
DECLARE
    v_auth_id UUID;
    v_profile_id UUID;
    v_faculty_count INT;
    v_courses_count INT;
    v_issue_found BOOLEAN := FALSE;
BEGIN
    -- Get current auth ID
    v_auth_id := auth.uid();
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DIAGNOSTIC RESULTS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Your Auth ID: %', v_auth_id;
    
    -- Check faculty record
    SELECT profile_id, 
           (SELECT COUNT(*) FROM public.courses WHERE instructor_id = f.id)
    INTO v_profile_id, v_courses_count
    FROM public.faculty f
    WHERE f.email = 'dr.jeffrey.turner@harbor.edu';
    
    IF v_profile_id IS NULL THEN
        RAISE NOTICE '❌ ISSUE 1: Faculty record has NO profile_id';
        v_issue_found := TRUE;
    ELSIF v_profile_id != v_auth_id THEN
        RAISE NOTICE '❌ ISSUE 2: Profile ID Mismatch!';
        RAISE NOTICE '   Faculty profile_id: %', v_profile_id;
        RAISE NOTICE '   Your auth.uid():    %', v_auth_id;
        v_issue_found := TRUE;
    ELSE
        RAISE NOTICE '✓ Profile ID matches correctly';
    END IF;
    
    IF v_courses_count = 0 THEN
        RAISE NOTICE '❌ ISSUE 3: No courses found for your faculty ID';
        v_issue_found := TRUE;
    ELSE
        RAISE NOTICE '✓ Found % courses for you', v_courses_count;
    END IF;
    
    -- Check if RLS is blocking
    IF v_courses_count > 0 AND v_profile_id = v_auth_id THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔍 Courses exist and profile matches, but still not showing?';
        RAISE NOTICE '   → This is likely an RLS POLICY issue';
        RAISE NOTICE '   → Run: sql/comprehensive-csv-policy-fix.sql';
    END IF;
    
    IF NOT v_issue_found THEN
        RAISE NOTICE '';
        RAISE NOTICE '✓ All checks passed!';
        RAISE NOTICE '✓ Data should be showing in your dashboard';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================
-- WHAT TO TELL THE DEVELOPER
-- ============================================================

SELECT 
    '=== COPY THIS TO TELL DEVELOPER ===' as instructions,
    'I am seeing:' as what_to_say;

-- Template for user to fill:
SELECT 
    'On my Faculty Dashboard, I see:' as prompt,
    '[ ] Active Courses: _____' as stat1,
    '[ ] Total Students: _____' as stat2, 
    '[ ] Badges Issued: _____' as stat3,
    '[ ] Pending Reviews: _____' as stat4,
    '[ ] Course cards showing: YES / NO' as courses,
    '[ ] If showing courses, list them: _____' as course_list;

SELECT 
    'Console Errors (if any):' as prompt,
    '[ ] infinite recursion error: YES / NO' as error1,
    '[ ] Other errors: _____' as error2;
