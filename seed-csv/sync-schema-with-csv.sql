-- =====================================================
-- SYNC DATABASE SCHEMA WITH CSV FILES
-- This adds missing columns from CSV files to database tables
-- =====================================================

-- =====================================================
-- 1. DEPARTMENTS TABLE
-- =====================================================
-- CSV has: department_id, university_id, name, code, head_of_department, established, description, total_students, total_faculty, total_courses, created_at, updated_at (12 columns)
-- DB has: id, university_id, name, code, head_of_department, established, description, total_students, total_faculty, total_courses, created_at, updated_at (12 columns)
-- MISSING IN DB: department_id (CSV compatibility ID)

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS department_id TEXT UNIQUE;

-- =====================================================
-- 2. FACULTY TABLE
-- =====================================================
-- CSV has: faculty_id, profile_id, university_id, department_id, name, email, phone, position, specialization, join_date, total_courses, total_students, status, created_at, updated_at (15 columns)
-- DB has: id, profile_id, university_id, department_id, name, email, phone, position, specialization, join_date, total_courses, total_students, created_at, updated_at (14 columns)
-- MISSING IN DB: faculty_id (CSV compatibility ID), status

ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS faculty_id TEXT UNIQUE;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- 3. ADMIN_STAFF TABLE
-- =====================================================
-- CSV has: admin_id, profile_id, university_id, name, email, phone, department, position, responsibilities, join_date, status, created_at, updated_at (13 columns)
-- DB has: id, profile_id, university_id, name, email, phone, department, position, responsibilities, join_date, created_at, updated_at (12 columns)
-- MISSING IN DB: admin_id (CSV compatibility ID), status

ALTER TABLE public.admin_staff ADD COLUMN IF NOT EXISTS admin_id TEXT UNIQUE;
ALTER TABLE public.admin_staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- 4. COURSES TABLE
-- =====================================================
-- CSV has: course_id, department_id, instructor_id, code, name, description, credits, semester, year, total_students, max_students, status, created_at, updated_at (14 columns)
-- DB has: id, department_id, instructor_id, code, name, description, credits, semester, year, total_students, max_students, status, created_at, updated_at (14 columns)
-- MISSING IN DB: course_id (CSV compatibility ID)

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_id TEXT UNIQUE;

-- =====================================================
-- 5. STUDENT_PROJECTS TABLE
-- =====================================================
-- CSV has: project_id, student_id, course_id, title, description, course_name, team_members, student_ids, mentor, status, progress, start_date, end_date, presentation_date, tags, grade, technologies, github_url, demo_url, proposal_status, midterm_status, final_status, created_at, updated_at (24 columns)
-- DB has: id, student_id, course_id, title, description, course_name, team_members, student_ids, mentor, status, progress, start_date, end_date, presentation_date, tags, grade, technologies, github_url, demo_url, proposal_status, midterm_status, final_status, created_at, updated_at (24 columns)
-- MISSING IN DB: project_id (CSV compatibility ID)

ALTER TABLE public.student_projects ADD COLUMN IF NOT EXISTS project_id TEXT UNIQUE;

-- =====================================================
-- 6. ACADEMIC_RECORDS TABLE
-- =====================================================
-- CSV has: record_id, student_id, course_id, student_name, course_code, course_name, semester, year, grade, credits, verified, submitted_date, verified_date, created_at, updated_at (15 columns)
-- DB has: id, student_id, course_id, student_name, course_code, course_name, semester, year, grade, credits, verified, submitted_date, verified_date, created_at, updated_at (15 columns)
-- MISSING IN DB: record_id (CSV compatibility ID)

ALTER TABLE public.academic_records ADD COLUMN IF NOT EXISTS record_id TEXT UNIQUE;

-- =====================================================
-- 7. STUDENT_FULL_RECORDS TABLE
-- =====================================================
-- CSV has: record_id, student_id, student_name, student_email, enrollment_id, department, semester, year, gpa, credits_earned, courses, status, created_at, updated_at (14 columns)
-- DB has: id, student_id, student_name, student_email, enrollment_id, department, semester, year, gpa, credits_earned, courses, status, created_at, updated_at (14 columns)
-- MISSING IN DB: record_id (CSV compatibility ID)

ALTER TABLE public.student_full_records ADD COLUMN IF NOT EXISTS record_id TEXT UNIQUE;

-- =====================================================
-- 8. USER_SKILLS TABLE
-- =====================================================
-- CSV has: user_skill_id, user_id, skill_name, skill_category, proficiency_level, verified, endorsements, created_at, updated_at (9 columns)
-- DB has: id, user_id, skill_name, skill_category, proficiency_level, verified, endorsements, created_at, updated_at (9 columns)
-- MISSING IN DB: user_skill_id (CSV compatibility ID)

ALTER TABLE public.user_skills ADD COLUMN IF NOT EXISTS user_skill_id TEXT UNIQUE;

-- =====================================================
-- 9. CAREER_INSIGHTS TABLE
-- =====================================================
-- CSV has: insight_id, student_id, readiness_score, skills_match, experience_level, profile_completeness, recommended_jobs, salary_insights, skill_trends, career_paths, generated_at, updated_at (12 columns)
-- DB has: id, student_id, readiness_score, skills_match, experience_level, profile_completeness, recommended_jobs, salary_insights, skill_trends, career_paths, generated_at, updated_at (12 columns)
-- MISSING IN DB: insight_id (CSV compatibility ID)

ALTER TABLE public.career_insights ADD COLUMN IF NOT EXISTS insight_id TEXT UNIQUE;

-- =====================================================
-- CREATE INDEXES FOR CSV COMPATIBILITY IDs
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_departments_department_id ON public.departments(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_faculty_id ON public.faculty(faculty_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_admin_id ON public.admin_staff(admin_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_id ON public.courses(course_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_project_id ON public.student_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_record_id ON public.academic_records(record_id);
CREATE INDEX IF NOT EXISTS idx_student_full_records_record_id ON public.student_full_records(record_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_skill_id ON public.user_skills(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_career_insights_insight_id ON public.career_insights(insight_id);

-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================
-- Added CSV compatibility columns (TEXT UNIQUE) to all 9 tables:
--   1. departments.department_id
--   2. faculty.faculty_id + faculty.status
--   3. admin_staff.admin_id + admin_staff.status
--   4. courses.course_id
--   5. student_projects.project_id
--   6. academic_records.record_id
--   7. student_full_records.record_id
--   8. user_skills.user_skill_id
--   9. career_insights.insight_id
--
-- These columns allow dual-ID strategy:
--   - id (UUID): Auto-generated database primary key
--   - *_id (TEXT): CSV import identifier for data consistency
-- =====================================================
