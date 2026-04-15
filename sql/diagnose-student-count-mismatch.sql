-- ============================================================
-- DIAGNOSTIC: Faculty Data Discrepancy Investigation
-- ============================================================
-- Dashboard shows Total Students: 1
-- Courses page shows Total Students: 72
-- Let's find out why
-- ============================================================

-- TEST 1: Check Dr. Turner's course data
SELECT 
    'Course Data' as check,
    c.code,
    c.name,
    c.total_students as metadata_student_count,
    c.max_students,
    c.instructor_id
FROM public.courses c
WHERE c.code = 'SE301';

-- TEST 2: Check actual enrollments in course_enrollments table
SELECT 
    'Enrollment Count' as check,
    COUNT(*) as actual_enrollments,
    COUNT(DISTINCT student_id) as unique_students
FROM public.course_enrollments ce
WHERE ce.course_id = (SELECT id FROM public.courses WHERE code = 'SE301');

-- TEST 3: List all enrollments for SE301
SELECT 
    'SE301 Enrollments' as check,
    ce.student_id,
    p.email,
    p.full_name
FROM public.course_enrollments ce
LEFT JOIN public.profiles p ON ce.student_id = p.id
WHERE ce.course_id = (SELECT id FROM public.courses WHERE code = 'SE301')
LIMIT 10;

-- TEST 4: Check if course_enrollments table has any data at all
SELECT 
    'Total Enrollments in System' as check,
    COUNT(*) as total_enrollment_records,
    COUNT(DISTINCT course_id) as courses_with_enrollments,
    COUNT(DISTINCT student_id) as total_unique_students
FROM public.course_enrollments;

-- TEST 5: Compare dashboard vs courses page logic
WITH course_data AS (
    SELECT id, code, name, total_students, instructor_id
    FROM public.courses
    WHERE instructor_id = '0b506c4f-d819-44c4-af44-42cd667b3192'
)
SELECT 
    'Comparison' as check,
    cd.code,
    cd.total_students as courses_page_shows,
    COUNT(DISTINCT ce.student_id) as dashboard_shows,
    CASE 
        WHEN cd.total_students = COUNT(DISTINCT ce.student_id) THEN '✅ MATCH'
        WHEN COUNT(DISTINCT ce.student_id) = 0 THEN '❌ NO ENROLLMENTS IN course_enrollments TABLE'
        ELSE '⚠️ MISMATCH - Metadata vs Actual'
    END as status
FROM course_data cd
LEFT JOIN public.course_enrollments ce ON cd.id = ce.course_id
GROUP BY cd.code, cd.name, cd.total_students;

-- TEST 6: Check if course_enrollments RLS is blocking access
SELECT 
    'RLS Status' as check,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ⚠️' ELSE 'DISABLED ✅' END as rls_status,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND pg_policies.tablename = pt.tablename) as policy_count
FROM pg_tables pt
WHERE schemaname = 'public' 
  AND tablename IN ('courses', 'course_enrollments', 'faculty');

-- ============================================================
-- DIAGNOSIS
-- ============================================================

DO $$
DECLARE
    v_course_metadata INT;
    v_actual_enrollments INT;
    v_enrollments_rls BOOLEAN;
BEGIN
    -- Get course metadata
    SELECT total_students INTO v_course_metadata
    FROM public.courses
    WHERE code = 'SE301';
    
    -- Get actual enrollments
    SELECT COUNT(DISTINCT student_id) INTO v_actual_enrollments
    FROM public.course_enrollments
    WHERE course_id = (SELECT id FROM public.courses WHERE code = 'SE301');
    
    -- Check RLS
    SELECT rowsecurity INTO v_enrollments_rls
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'course_enrollments';
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'DATA DISCREPANCY DIAGNOSIS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Courses Page Shows: % students (from courses.total_students)', v_course_metadata;
    RAISE NOTICE 'Dashboard Shows: % students (from course_enrollments count)', v_actual_enrollments;
    RAISE NOTICE 'course_enrollments RLS: %', CASE WHEN v_enrollments_rls THEN 'ENABLED' ELSE 'DISABLED' END;
    RAISE NOTICE '';
    
    IF v_actual_enrollments = 0 THEN
        RAISE NOTICE '❌ PROBLEM: course_enrollments table is EMPTY';
        RAISE NOTICE '   → courses.total_students = % (metadata from CSV)', v_course_metadata;
        RAISE NOTICE '   → Actual enrollments = 0 (no data in course_enrollments)';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUTION:';
        RAISE NOTICE '   1. Import enrollment data from CSV';
        RAISE NOTICE '   2. OR modify courses page to use courses.total_students';
        RAISE NOTICE '   3. OR modify dashboard to use courses.total_students';
    ELSIF v_enrollments_rls THEN
        RAISE NOTICE '⚠️  WARNING: RLS is enabled on course_enrollments';
        RAISE NOTICE '   → This might be blocking enrollment queries';
        RAISE NOTICE '   → Check if policies allow faculty to see enrollments';
    ELSIF v_course_metadata != v_actual_enrollments THEN
        RAISE NOTICE '⚠️  MISMATCH: Metadata vs Actual';
        RAISE NOTICE '   → courses.total_students is a cached/calculated field';
        RAISE NOTICE '   → Should be updated when enrollments change';
    ELSE
        RAISE NOTICE '✅ Data is consistent';
    END IF;
    
    RAISE NOTICE '============================================================';
END $$;
