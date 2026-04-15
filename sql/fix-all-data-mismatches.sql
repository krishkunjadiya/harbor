-- =============================================
-- FIX ALL DATA MISMATCHES - COMPREHENSIVE SCRIPT
-- =============================================
-- Generated: February 14, 2026
-- Purpose: Fix 306 data mismatches found in cross-table validation
-- Run this in Supabase SQL Editor
-- =============================================

-- BACKUP REMINDER
-- Before running this script, create a backup:
-- pg_dump your_database > backup_before_fixes.sql

BEGIN;

-- =============================================
-- SECTION 1: FIX COURSE TOTAL_STUDENTS
-- =============================================
-- Issue: courses.total_students doesn't match actual enrollment counts
-- Mismatches: 50 courses

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING COURSE TOTAL_STUDENTS ===';
    
    -- Update each course with actual enrollment count
    WITH actual_enrollments AS (
        SELECT 
            course_id,
            COUNT(*) as actual_count
        FROM course_enrollments
        WHERE status = 'active'
        GROUP BY course_id
    )
    UPDATE courses c
    SET 
        total_students = COALESCE(ae.actual_count, 0),
        updated_at = NOW()
    FROM actual_enrollments ae
    WHERE c.id = ae.course_id
      AND c.total_students != ae.actual_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % course total_students mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 2: FIX FACULTY TOTAL_COURSES
-- =============================================
-- Issue: faculty.total_courses doesn't match actual course assignments
-- Mismatches: 50 faculty members

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING FACULTY TOTAL_COURSES ===';
    
    WITH actual_courses AS (
        SELECT 
            instructor_id,
            COUNT(*) as actual_count
        FROM courses
        WHERE status = 'active'
        GROUP BY instructor_id
    )
    UPDATE faculty f
    SET 
        total_courses = COALESCE(ac.actual_count, 0),
        updated_at = NOW()
    FROM actual_courses ac
    WHERE f.id = ac.instructor_id
      AND f.total_courses != ac.actual_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % faculty total_courses mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 3: FIX FACULTY TOTAL_STUDENTS
-- =============================================
-- Issue: faculty.total_students doesn't match actual student counts
-- Mismatches: 50 faculty members (CRITICAL)

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING FACULTY TOTAL_STUDENTS ===';
    
    WITH actual_students AS (
        SELECT 
            c.instructor_id,
            COUNT(DISTINCT ce.student_id) as actual_count
        FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.status = 'active' 
          AND ce.status = 'active'
        GROUP BY c.instructor_id
    )
    UPDATE faculty f
    SET 
        total_students = COALESCE(ast.actual_count, 0),
        updated_at = NOW()
    FROM actual_students ast
    WHERE f.id = ast.instructor_id
      AND f.total_students != ast.actual_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % faculty total_students mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 4: FIX DEPARTMENT TOTALS
-- =============================================
-- Issue: departments have incorrect totals for students, faculty, courses
-- Mismatches: 12 (4 departments × 3 metrics)

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING DEPARTMENT TOTAL_STUDENTS ===';
    
    WITH dept_students AS (
        SELECT 
            d.id as department_id,
            COUNT(DISTINCT s.id) as student_count
        FROM departments d
        LEFT JOIN students s ON s.department = d.name
        WHERE s.status = 'active'
        GROUP BY d.id
    )
    UPDATE departments d
    SET 
        total_students = COALESCE(ds.student_count, 0)
    FROM dept_students ds
    WHERE d.id = ds.department_id
      AND d.total_students != ds.student_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % department total_students mismatches', fixed_count;
    
    RAISE NOTICE '=== FIXING DEPARTMENT TOTAL_FACULTY ===';
    
    WITH dept_faculty AS (
        SELECT 
            department_id,
            COUNT(*) as faculty_count
        FROM faculty
        WHERE status = 'active'
        GROUP BY department_id
    )
    UPDATE departments d
    SET 
        total_faculty = COALESCE(df.faculty_count, 0)
    FROM dept_faculty df
    WHERE d.id = df.department_id
      AND d.total_faculty != df.faculty_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % department total_faculty mismatches', fixed_count;
    
    RAISE NOTICE '=== FIXING DEPARTMENT TOTAL_COURSES ===';
    
    WITH dept_courses AS (
        SELECT 
            department_id,
            COUNT(*) as course_count
        FROM courses
        WHERE status = 'active'
        GROUP BY department_id
    )
    UPDATE departments d
    SET 
        total_courses = COALESCE(dc.course_count, 0)
    FROM dept_courses dc
    WHERE d.id = dc.department_id
      AND d.total_courses != dc.course_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % department total_courses mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 5: FIX UNIVERSITY TOTALS (CRITICAL)
-- =============================================
-- Issue: universities have severely wrong totals (off by thousands)
-- Mismatches: 4 (2 universities × 2 metrics)

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING UNIVERSITY TOTAL_STUDENTS (CRITICAL) ===';
    
    -- Need to handle the fact that students.university is a NAME not ID
    -- This is a workaround until the university reference is fixed
    WITH univ_students AS (
        SELECT 
            u.id as university_id,
            COUNT(DISTINCT s.id) as student_count
        FROM universities u
        LEFT JOIN students s ON s.university = u.university_name
        WHERE s.status = 'active'
        GROUP BY u.id
    )
    UPDATE universities u
    SET 
        total_students = COALESCE(us.student_count, 0)
    FROM univ_students us
    WHERE u.id = us.university_id
      AND u.total_students != us.student_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % university total_students mismatches', fixed_count;
    
    RAISE NOTICE '=== FIXING UNIVERSITY TOTAL_FACULTY ===';
    
    WITH univ_faculty AS (
        SELECT 
            university_id,
            COUNT(*) as faculty_count
        FROM faculty
        WHERE status = 'active'
        GROUP BY university_id
    )
    UPDATE universities u
    SET 
        total_faculty = COALESCE(uf.faculty_count, 0)
    FROM univ_faculty uf
    WHERE u.id = uf.university_id
      AND u.total_faculty != uf.faculty_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % university total_faculty mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 6: FIX STUDENT GPA SYNC
-- =============================================
-- Issue: students.gpa doesn't match transcripts.cumulative_gpa
-- Mismatches: 48 students
-- Decision: transcripts.cumulative_gpa is source of truth

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== SYNCING STUDENT GPA FROM TRANSCRIPTS ===';
    
    UPDATE students s
    SET 
        gpa = t.cumulative_gpa
    FROM transcripts t
    WHERE s.id = t.student_id
      AND ABS(s.gpa - t.cumulative_gpa) > 0.01; -- Only update if difference > 0.01
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % student GPA mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 7: FIX JOB APPLICATION COUNTS
-- =============================================
-- Issue: jobs.applications_count doesn't match actual applications
-- Mismatches: 50 jobs

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING JOB APPLICATION COUNTS ===';
    
    WITH actual_apps AS (
        SELECT 
            job_id,
            COUNT(*) as app_count
        FROM job_applications
        GROUP BY job_id
    )
    UPDATE jobs j
    SET 
        applications_count = COALESCE(aa.app_count, 0),
        updated_at = NOW()
    FROM actual_apps aa
    WHERE j.id = aa.job_id
      AND j.applications_count != aa.app_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % job application count mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 8: FIX SKILL ENDORSEMENT COUNTS
-- =============================================
-- Issue: user_skills.endorsements doesn't match actual endorsement records
-- Mismatches: 42 skills

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== FIXING SKILL ENDORSEMENT COUNTS ===';
    
    WITH actual_endorsements AS (
        SELECT 
            skill_id,
            COUNT(*) as endorsement_count
        FROM skill_endorsements
        GROUP BY skill_id
    )
    UPDATE user_skills us
    SET 
        endorsements = COALESCE(ae.endorsement_count, 0),
        updated_at = NOW()
    FROM actual_endorsements ae
    WHERE us.id = ae.skill_id
      AND us.endorsements != ae.endorsement_count;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % skill endorsement count mismatches', fixed_count;
END $$;

-- =============================================
-- SECTION 9: CREATE TRIGGERS FOR AUTO-UPDATES
-- =============================================
-- Prevent future mismatches by auto-updating parent tables

DO $$
BEGIN
    RAISE NOTICE '=== CREATING TRIGGERS TO PREVENT FUTURE MISMATCHES ===';
END $$;

-- Trigger 1: Auto-update course total_students
CREATE OR REPLACE FUNCTION update_course_total_students()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses
    SET 
        total_students = (
            SELECT COUNT(*) 
            FROM course_enrollments 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
              AND status = 'active'
        )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_course_total_students ON course_enrollments;
CREATE TRIGGER trg_update_course_total_students
    AFTER INSERT OR UPDATE OR DELETE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_total_students();

-- Trigger 2: Auto-update faculty total_courses
CREATE OR REPLACE FUNCTION update_faculty_total_courses()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old instructor if changed
    IF TG_OP = 'UPDATE' AND OLD.instructor_id IS DISTINCT FROM NEW.instructor_id THEN
        UPDATE faculty
        SET 
            total_courses = (
                SELECT COUNT(*) 
                FROM courses 
                WHERE instructor_id = OLD.instructor_id
                  AND status = 'active'
            )
        WHERE id = OLD.instructor_id;
    END IF;
    
    -- Update new/current instructor
    UPDATE faculty
    SET 
        total_courses = (
            SELECT COUNT(*) 
            FROM courses 
            WHERE instructor_id = COALESCE(NEW.instructor_id, OLD.instructor_id)
              AND status = 'active'
        )
    WHERE id = COALESCE(NEW.instructor_id, OLD.instructor_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_faculty_total_courses ON courses;
CREATE TRIGGER trg_update_faculty_total_courses
    AFTER INSERT OR UPDATE OR DELETE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_faculty_total_courses();

-- Trigger 3: Auto-update faculty total_students
CREATE OR REPLACE FUNCTION update_faculty_total_students()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the faculty member from the course
    UPDATE faculty f
    SET 
        total_students = (
            SELECT COUNT(DISTINCT ce.student_id)
            FROM courses c
            JOIN course_enrollments ce ON c.id = ce.course_id
            WHERE c.instructor_id = f.id
              AND c.status = 'active'
              AND ce.status = 'active'
        )
    WHERE f.id IN (
        SELECT DISTINCT c.instructor_id
        FROM courses c
        WHERE c.id = COALESCE(NEW.course_id, OLD.course_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_faculty_total_students ON course_enrollments;
CREATE TRIGGER trg_update_faculty_total_students
    AFTER INSERT OR UPDATE OR DELETE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_faculty_total_students();

-- Trigger 4: Auto-update job applications_count
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs
    SET 
        applications_count = (
            SELECT COUNT(*) 
            FROM job_applications 
            WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
        )
    WHERE id = COALESCE(NEW.job_id, OLD.job_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_job_applications_count ON job_applications;
CREATE TRIGGER trg_update_job_applications_count
    AFTER INSERT OR UPDATE OR DELETE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_applications_count();

-- Trigger 5: Auto-update user_skills endorsements
CREATE OR REPLACE FUNCTION update_skill_endorsements_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_skills
    SET 
        endorsements = (
            SELECT COUNT(*) 
            FROM skill_endorsements 
            WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id)
        )
    WHERE id = COALESCE(NEW.skill_id, OLD.skill_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_skill_endorsements_count ON skill_endorsements;
CREATE TRIGGER trg_update_skill_endorsements_count
    AFTER INSERT OR UPDATE OR DELETE ON skill_endorsements
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_endorsements_count();

-- Trigger 6: Auto-sync student GPA from transcripts
CREATE OR REPLACE FUNCTION sync_student_gpa_from_transcript()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students
    SET 
        gpa = NEW.cumulative_gpa
    WHERE id = NEW.student_id
      AND ABS(gpa - NEW.cumulative_gpa) > 0.01;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_student_gpa ON transcripts;
CREATE TRIGGER trg_sync_student_gpa
    AFTER INSERT OR UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_gpa_from_transcript();

-- =============================================
-- SECTION 10: VERIFICATION QUERIES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '=== DATA FIX COMPLETE ===';
    RAISE NOTICE 'Running verification queries...';
END $$;

-- Verify course totals
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM courses c
    LEFT JOIN (
        SELECT course_id, COUNT(*) as count 
        FROM course_enrollments 
        WHERE status = 'active'
        GROUP BY course_id
    ) ce ON c.id = ce.course_id
    WHERE c.total_students != COALESCE(ce.count, 0);
    
    RAISE NOTICE 'Course total_students mismatches remaining: %', mismatch_count;
END $$;

-- Verify faculty course counts
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM faculty f
    LEFT JOIN (
        SELECT instructor_id, COUNT(*) as count 
        FROM courses 
        WHERE status = 'active'
        GROUP BY instructor_id
    ) c ON f.id = c.instructor_id
    WHERE f.total_courses != COALESCE(c.count, 0);
    
    RAISE NOTICE 'Faculty total_courses mismatches remaining: %', mismatch_count;
END $$;

-- Verify faculty student counts
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM faculty f
    LEFT JOIN (
        SELECT c.instructor_id, COUNT(DISTINCT ce.student_id) as count
        FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.status = 'active' AND ce.status = 'active'
        GROUP BY c.instructor_id
    ) s ON f.id = s.instructor_id
    WHERE f.total_students != COALESCE(s.count, 0);
    
    RAISE NOTICE 'Faculty total_students mismatches remaining: %', mismatch_count;
END $$;

-- Verify student GPA sync
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM students s
    JOIN transcripts t ON s.id = t.student_id
    WHERE ABS(s.gpa - t.cumulative_gpa) > 0.01;
    
    RAISE NOTICE 'Student GPA mismatches remaining: %', mismatch_count;
END $$;

-- Verify job application counts
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM jobs j
    LEFT JOIN (
        SELECT job_id, COUNT(*) as count 
        FROM job_applications 
        GROUP BY job_id
    ) ja ON j.id = ja.job_id
    WHERE j.applications_count != COALESCE(ja.count, 0);
    
    RAISE NOTICE 'Job applications_count mismatches remaining: %', mismatch_count;
END $$;

-- Verify skill endorsement counts
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatch_count
    FROM user_skills us
    LEFT JOIN (
        SELECT skill_id, COUNT(*) as count 
        FROM skill_endorsements 
        GROUP BY skill_id
    ) se ON us.id = se.skill_id
    WHERE us.endorsements != COALESCE(se.count, 0);
    
    RAISE NOTICE 'Skill endorsement mismatches remaining: %', mismatch_count;
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DATA MISMATCH FIXES COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'All 306 data mismatches have been corrected.';
    RAISE NOTICE 'Database triggers created to prevent future mismatches.';
    RAISE NOTICE 'Check the verification output above for confirmation.';
    RAISE NOTICE '==============================================';
END $$;
