-- =============================================
-- QUICK FIX REFERENCE - Individual Commands
-- =============================================
-- Use these if you want to fix issues one at a time
-- Or if you only want to fix specific categories
-- =============================================

-- =============================================
-- OPTION 1: FIX ONLY COURSE ENROLLMENTS
-- =============================================

UPDATE courses c
SET 
    total_students = COALESCE(ce.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT course_id, COUNT(*) as actual_count
    FROM course_enrollments
    WHERE status = 'active'
    GROUP BY course_id
) ce
WHERE c.id = ce.course_id
  AND c.total_students != ce.actual_count;

-- =============================================
-- OPTION 2: FIX ONLY FACULTY COURSE COUNTS
-- =============================================

UPDATE faculty f
SET 
    total_courses = COALESCE(c.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT instructor_id, COUNT(*) as actual_count
    FROM courses
    WHERE status = 'active'
    GROUP BY instructor_id
) c
WHERE f.id = c.instructor_id
  AND f.total_courses != c.actual_count;

-- =============================================
-- OPTION 3: FIX ONLY FACULTY STUDENT COUNTS
-- =============================================

UPDATE faculty f
SET 
    total_students = COALESCE(s.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as actual_count
    FROM courses c
    JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE c.status = 'active' AND ce.status = 'active'
    GROUP BY c.instructor_id
) s
WHERE f.id = s.instructor_id
  AND f.total_students != s.actual_count;

-- =============================================
-- OPTION 4: FIX ONLY UNIVERSITY TOTALS
-- =============================================

-- Fix university student counts
UPDATE universities u
SET 
    total_students = COALESCE(s.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT university, COUNT(*) as actual_count
    FROM students
    WHERE status = 'active'
    GROUP BY university
) s
WHERE u.university_name = s.university
  AND u.total_students != s.actual_count;

-- Fix university faculty counts
UPDATE universities u
SET 
    total_faculty = COALESCE(f.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT university_id, COUNT(*) as actual_count
    FROM faculty
    WHERE status = 'active'
    GROUP BY university_id
) f
WHERE u.id = f.university_id
  AND u.total_faculty != f.actual_count;

-- =============================================
-- OPTION 5: FIX ONLY DEPARTMENT TOTALS
-- =============================================

-- Fix department student counts
UPDATE departments d
SET 
    total_students = COALESCE(s.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT department, COUNT(*) as actual_count
    FROM students
    WHERE status = 'active'
    GROUP BY department
) s
WHERE d.name = s.department
  AND d.total_students != s.actual_count;

-- Fix department faculty counts
UPDATE departments d
SET 
    total_faculty = COALESCE(f.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT department_id, COUNT(*) as actual_count
    FROM faculty
    WHERE status = 'active'
    GROUP BY department_id
) f
WHERE d.id = f.department_id
  AND d.total_faculty != f.actual_count;

-- Fix department course counts
UPDATE departments d
SET 
    total_courses = COALESCE(c.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT department_id, COUNT(*) as actual_count
    FROM courses
    WHERE status = 'active'
    GROUP BY department_id
) c
WHERE d.id = c.department_id
  AND d.total_courses != c.actual_count;

-- =============================================
-- OPTION 6: FIX ONLY STUDENT GPA
-- =============================================

UPDATE students s
SET 
    gpa = t.cumulative_gpa,
    updated_at = NOW()
FROM transcripts t
WHERE s.id = t.student_id
  AND ABS(s.gpa - t.cumulative_gpa) > 0.01;

-- =============================================
-- OPTION 7: FIX ONLY JOB APPLICATION COUNTS
-- =============================================

UPDATE jobs j
SET 
    applications_count = COALESCE(a.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT job_id, COUNT(*) as actual_count
    FROM job_applications
    GROUP BY job_id
) a
WHERE j.id = a.job_id
  AND j.applications_count != a.actual_count;

-- =============================================
-- OPTION 8: FIX ONLY SKILL ENDORSEMENT COUNTS
-- =============================================

UPDATE user_skills us
SET 
    endorsements = COALESCE(e.actual_count, 0),
    updated_at = NOW()
FROM (
    SELECT skill_id, COUNT(*) as actual_count
    FROM skill_endorsements
    GROUP BY skill_id
) e
WHERE us.id = e.skill_id
  AND us.endorsements != e.actual_count;

-- =============================================
-- VERIFICATION QUERIES (Run after any fix)
-- =============================================

-- Check course mismatches
SELECT COUNT(*) as remaining_mismatches
FROM courses c
LEFT JOIN (
    SELECT course_id, COUNT(*) as count 
    FROM course_enrollments WHERE status = 'active' GROUP BY course_id
) ce ON c.id = ce.course_id
WHERE c.total_students != COALESCE(ce.count, 0);

-- Check faculty course mismatches
SELECT COUNT(*) as remaining_mismatches
FROM faculty f
LEFT JOIN (
    SELECT instructor_id, COUNT(*) as count 
    FROM courses WHERE status = 'active' GROUP BY instructor_id
) c ON f.id = c.instructor_id
WHERE f.total_courses != COALESCE(c.count, 0);

-- Check faculty student mismatches
SELECT COUNT(*) as remaining_mismatches
FROM faculty f
LEFT JOIN (
    SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as count
    FROM courses c JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE c.status = 'active' AND ce.status = 'active'
    GROUP BY c.instructor_id
) s ON f.id = s.instructor_id
WHERE f.total_students != COALESCE(s.count, 0);

-- Check GPA mismatches
SELECT COUNT(*) as remaining_mismatches
FROM students s
JOIN transcripts t ON s.id = t.student_id
WHERE ABS(s.gpa - t.cumulative_gpa) > 0.01;

-- Check job application mismatches
SELECT COUNT(*) as remaining_mismatches
FROM jobs j
LEFT JOIN (
    SELECT job_id, COUNT(*) as count 
    FROM job_applications GROUP BY job_id
) a ON j.id = a.job_id
WHERE j.applications_count != COALESCE(a.count, 0);

-- Check endorsement mismatches
SELECT COUNT(*) as remaining_mismatches
FROM user_skills us
LEFT JOIN (
    SELECT skill_id, COUNT(*) as count 
    FROM skill_endorsements GROUP BY skill_id
) e ON us.id = e.skill_id
WHERE us.endorsements != COALESCE(e.count, 0);

-- =============================================
-- NOTES
-- =============================================
-- 1. Each OPTION can be run independently
-- 2. Run verification query after each fix
-- 3. For complete fix, use fix-all-data-mismatches.sql instead
-- 4. These individual commands do NOT create triggers
-- 5. If you want triggers, run the complete fix script
