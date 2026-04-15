-- =============================================
-- VERIFY DATA MISMATCHES - CHECK BEFORE FIXING
-- =============================================
-- Purpose: Check current state of all data mismatches
-- Run this BEFORE running fix-all-data-mismatches.sql
-- =============================================

-- This script will show you exactly what needs to be fixed

SET client_min_messages TO NOTICE;

-- =============================================
-- CHECK 1: COURSE ENROLLMENTS
-- =============================================

SELECT 
    '=== COURSE ENROLLMENT MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM courses c
LEFT JOIN (
    SELECT course_id, COUNT(*) as actual_count 
    FROM course_enrollments 
    WHERE status = 'active'
    GROUP BY course_id
) ce ON c.id = ce.course_id
WHERE c.total_students != COALESCE(ce.actual_count, 0);

-- Show top 10 worst mismatches
SELECT 
    c.code,
    c.name,
    c.total_students as stored_count,
    COALESCE(ce.actual_count, 0) as actual_count,
    c.total_students - COALESCE(ce.actual_count, 0) as difference
FROM courses c
LEFT JOIN (
    SELECT course_id, COUNT(*) as actual_count 
    FROM course_enrollments 
    WHERE status = 'active'
    GROUP BY course_id
) ce ON c.id = ce.course_id
WHERE c.total_students != COALESCE(ce.actual_count, 0)
ORDER BY ABS(c.total_students - COALESCE(ce.actual_count, 0)) DESC
LIMIT 10;

-- =============================================
-- CHECK 2: FACULTY COURSE COUNTS
-- =============================================

SELECT 
    '=== FACULTY COURSE COUNT MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM faculty f
LEFT JOIN (
    SELECT instructor_id, COUNT(*) as actual_count 
    FROM courses 
    WHERE status = 'active'
    GROUP BY instructor_id
) c ON f.id = c.instructor_id
WHERE f.total_courses != COALESCE(c.actual_count, 0);

-- Show top 10 worst mismatches
SELECT 
    f.name,
    f.total_courses as stored_count,
    COALESCE(c.actual_count, 0) as actual_count,
    f.total_courses - COALESCE(c.actual_count, 0) as difference
FROM faculty f
LEFT JOIN (
    SELECT instructor_id, COUNT(*) as actual_count 
    FROM courses 
    WHERE status = 'active'
    GROUP BY instructor_id
) c ON f.id = c.instructor_id
WHERE f.total_courses != COALESCE(c.actual_count, 0)
ORDER BY ABS(f.total_courses - COALESCE(c.actual_count, 0)) DESC
LIMIT 10;

-- =============================================
-- CHECK 3: FACULTY STUDENT COUNTS
-- =============================================

SELECT 
    '=== FACULTY STUDENT COUNT MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM faculty f
LEFT JOIN (
    SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as actual_count
    FROM courses c
    JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE c.status = 'active' AND ce.status = 'active'
    GROUP BY c.instructor_id
) s ON f.id = s.instructor_id
WHERE f.total_students != COALESCE(s.actual_count, 0);

-- Show top 10 worst mismatches
SELECT 
    f.name,
    f.total_students as stored_count,
    COALESCE(s.actual_count, 0) as actual_count,
    f.total_students - COALESCE(s.actual_count, 0) as difference
FROM faculty f
LEFT JOIN (
    SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as actual_count
    FROM courses c
    JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE c.status = 'active' AND ce.status = 'active'
    GROUP BY c.instructor_id
) s ON f.id = s.instructor_id
WHERE f.total_students != COALESCE(s.actual_count, 0)
ORDER BY ABS(f.total_students - COALESCE(s.actual_count, 0)) DESC
LIMIT 10;

-- =============================================
-- CHECK 4: UNIVERSITY TOTALS
-- =============================================

SELECT 
    '=== UNIVERSITY STUDENT COUNT MISMATCHES ===' as check_type,
    u.university_name,
    u.total_students as stored_count,
    COALESCE(s.actual_count, 0) as actual_count,
    u.total_students - COALESCE(s.actual_count, 0) as difference
FROM universities u
LEFT JOIN (
    SELECT university, COUNT(*) as actual_count
    FROM students
    WHERE status = 'active'
    GROUP BY university
) s ON u.university_name = s.university
WHERE u.total_students != COALESCE(s.actual_count, 0);

SELECT 
    '=== UNIVERSITY FACULTY COUNT MISMATCHES ===' as check_type,
    u.university_name,
    u.total_faculty as stored_count,
    COALESCE(f.actual_count, 0) as actual_count,
    u.total_faculty - COALESCE(f.actual_count, 0) as difference
FROM universities u
LEFT JOIN (
    SELECT university_id, COUNT(*) as actual_count
    FROM faculty
    WHERE status = 'active'
    GROUP BY university_id
) f ON u.id = f.university_id
WHERE u.total_faculty != COALESCE(f.actual_count, 0);

-- =============================================
-- CHECK 5: DEPARTMENT TOTALS
-- =============================================

SELECT 
    '=== DEPARTMENT STUDENT COUNT MISMATCHES ===' as check_type,
    d.name,
    d.total_students as stored_count,
    COALESCE(s.actual_count, 0) as actual_count,
    d.total_students - COALESCE(s.actual_count, 0) as difference
FROM departments d
LEFT JOIN (
    SELECT department, COUNT(*) as actual_count
    FROM students
    WHERE status = 'active'
    GROUP BY department
) s ON d.name = s.department
WHERE d.total_students != COALESCE(s.actual_count, 0);

SELECT 
    '=== DEPARTMENT FACULTY COUNT MISMATCHES ===' as check_type,
    d.name,
    d.total_faculty as stored_count,
    COALESCE(f.actual_count, 0) as actual_count,
    d.total_faculty - COALESCE(f.actual_count, 0) as difference
FROM departments d
LEFT JOIN (
    SELECT department_id, COUNT(*) as actual_count
    FROM faculty
    WHERE status = 'active'
    GROUP BY department_id
) f ON d.id = f.department_id
WHERE d.total_faculty != COALESCE(f.actual_count, 0);

SELECT 
    '=== DEPARTMENT COURSE COUNT MISMATCHES ===' as check_type,
    d.name,
    d.total_courses as stored_count,
    COALESCE(c.actual_count, 0) as actual_count,
    d.total_courses - COALESCE(c.actual_count, 0) as difference
FROM departments d
LEFT JOIN (
    SELECT department_id, COUNT(*) as actual_count
    FROM courses
    WHERE status = 'active'
    GROUP BY department_id
) c ON d.id = c.department_id
WHERE d.total_courses != COALESCE(c.actual_count, 0);

-- =============================================
-- CHECK 6: STUDENT GPA SYNC
-- =============================================

SELECT 
    '=== STUDENT GPA MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM students s
JOIN transcripts t ON s.id = t.student_id
WHERE ABS(s.gpa - t.cumulative_gpa) > 0.01;

-- Show top 10 worst GPA mismatches
SELECT 
    s.enrollment_number,
    s.program,
    s.gpa as student_table_gpa,
    t.cumulative_gpa as transcript_gpa,
    ROUND((t.cumulative_gpa - s.gpa)::numeric, 2) as difference
FROM students s
JOIN transcripts t ON s.id = t.student_id
WHERE ABS(s.gpa - t.cumulative_gpa) > 0.01
ORDER BY ABS(s.gpa - t.cumulative_gpa) DESC
LIMIT 10;

-- =============================================
-- CHECK 7: JOB APPLICATION COUNTS
-- =============================================

SELECT 
    '=== JOB APPLICATION COUNT MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM jobs j
LEFT JOIN (
    SELECT job_id, COUNT(*) as actual_count 
    FROM job_applications 
    GROUP BY job_id
) ja ON j.id = ja.job_id
WHERE j.applications_count != COALESCE(ja.actual_count, 0);

-- Show top 10 worst mismatches
SELECT 
    j.title,
    j.company,
    j.applications_count as stored_count,
    COALESCE(ja.actual_count, 0) as actual_count,
    j.applications_count - COALESCE(ja.actual_count, 0) as difference
FROM jobs j
LEFT JOIN (
    SELECT job_id, COUNT(*) as actual_count 
    FROM job_applications 
    GROUP BY job_id
) ja ON j.id = ja.job_id
WHERE j.applications_count != COALESCE(ja.actual_count, 0)
ORDER BY ABS(j.applications_count - COALESCE(ja.actual_count, 0)) DESC
LIMIT 10;

-- =============================================
-- CHECK 8: SKILL ENDORSEMENT COUNTS
-- =============================================

SELECT 
    '=== SKILL ENDORSEMENT COUNT MISMATCHES ===' as check_type,
    COUNT(*) as total_mismatches
FROM user_skills us
LEFT JOIN (
    SELECT skill_id, COUNT(*) as actual_count 
    FROM skill_endorsements 
    GROUP BY skill_id
) se ON us.id = se.skill_id
WHERE us.endorsements != COALESCE(se.actual_count, 0);

-- Show top 10 worst mismatches
SELECT 
    us.skill_name,
    us.endorsements as stored_count,
    COALESCE(se.actual_count, 0) as actual_count,
    us.endorsements - COALESCE(se.actual_count, 0) as difference
FROM user_skills us
LEFT JOIN (
    SELECT skill_id, COUNT(*) as actual_count 
    FROM skill_endorsements 
    GROUP BY skill_id
) se ON us.id = se.skill_id
WHERE us.endorsements != COALESCE(se.actual_count, 0)
ORDER BY ABS(us.endorsements - COALESCE(se.actual_count, 0)) DESC
LIMIT 10;

-- =============================================
-- SUMMARY REPORT
-- =============================================

SELECT 
    '=== MISMATCH SUMMARY ===' as report_section,
    'Total Issues Found' as metric,
    (
        (SELECT COUNT(*) FROM courses c LEFT JOIN (SELECT course_id, COUNT(*) as c FROM course_enrollments WHERE status = 'active' GROUP BY course_id) ce ON c.id = ce.course_id WHERE c.total_students != COALESCE(ce.c, 0)) +
        (SELECT COUNT(*) FROM faculty f LEFT JOIN (SELECT instructor_id, COUNT(*) as c FROM courses WHERE status = 'active' GROUP BY instructor_id) co ON f.id = co.instructor_id WHERE f.total_courses != COALESCE(co.c, 0)) +
        (SELECT COUNT(*) FROM faculty f LEFT JOIN (SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as c FROM courses c JOIN course_enrollments ce ON c.id = ce.course_id WHERE c.status = 'active' AND ce.status = 'active' GROUP BY c.instructor_id) s ON f.id = s.instructor_id WHERE f.total_students != COALESCE(s.c, 0)) +
        (SELECT COUNT(*) FROM students s JOIN transcripts t ON s.id = t.student_id WHERE ABS(s.gpa - t.cumulative_gpa) > 0.01) +
        (SELECT COUNT(*) FROM jobs j LEFT JOIN (SELECT job_id, COUNT(*) as c FROM job_applications GROUP BY job_id) ja ON j.id = ja.job_id WHERE j.applications_count != COALESCE(ja.c, 0)) +
        (SELECT COUNT(*) FROM user_skills us LEFT JOIN (SELECT skill_id, COUNT(*) as c FROM skill_endorsements GROUP BY skill_id) se ON us.id = se.skill_id WHERE us.endorsements != COALESCE(se.c, 0))
    ) as count;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 
    '===============================================' as message
UNION ALL
SELECT 'VERIFICATION COMPLETE'
UNION ALL
SELECT '===============================================' 
UNION ALL
SELECT 'Review the results above to understand what will be fixed.'
UNION ALL
SELECT 'If you are ready to proceed, run: fix-all-data-mismatches.sql'
UNION ALL
SELECT '==============================================';
