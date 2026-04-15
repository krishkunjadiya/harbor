-- ============================================================
-- COMPREHENSIVE CSV & POLICY AUDIT AND FIX
-- ============================================================
-- This script identifies and fixes all common issues with CSV data
-- and RLS policies in the Harbor platform database

-- ============================================================
-- PART 1: DATABASE SCHEMA FIXES
-- ============================================================

-- 1.1 Add missing columns to faculty table
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS faculty_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave'));

-- 1.2 Add missing columns to other tables as needed
ALTER TABLE public.admin_staff 
ADD COLUMN IF NOT EXISTS staff_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave'));

ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS department_id TEXT UNIQUE;

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS course_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS enrolled_students INTEGER DEFAULT 0;

-- 1.3 Add missing course enrollment table if not exists
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  grade TEXT,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- 1.4 Add missing assignments table if not exists
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Add missing assignment_submissions table if not exists
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'missing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- PART 2: DATA VALIDATION AND FIXES
-- ============================================================

-- 2.1 Update faculty profile_id from profiles where they don't match auth users
UPDATE public.faculty f
SET profile_id = au.id
FROM auth.users au
WHERE f.email = au.email
AND (f.profile_id IS NULL OR f.profile_id != au.id);

-- 2.2 Ensure all profiles have correct user_type
UPDATE public.profiles
SET user_type = 'university'
WHERE role = 'faculty' 
AND (user_type IS NULL OR user_type != 'university');

UPDATE public.profiles
SET user_type = 'student'
WHERE role = 'student' 
AND (user_type IS NULL OR user_type != 'student');

UPDATE public.profiles
SET user_type = 'recruiter'
WHERE role = 'recruiter' 
AND (user_type IS NULL OR user_type != 'recruiter');

UPDATE public.profiles
SET user_type = 'admin'
WHERE role IN ('admin', 'admin_staff')
AND (user_type IS NULL OR user_type NOT IN ('admin', 'university'));

-- 2.3 Fix orphaned records - remove faculty without valid profile_id
DELETE FROM public.faculty
WHERE profile_id IS NULL
OR profile_id NOT IN (SELECT id FROM auth.users);

-- 2.4 Fix orphaned courses - remove courses with invalid instructor_id
DELETE FROM public.courses
WHERE instructor_id IS NOT NULL
AND instructor_id NOT IN (SELECT id FROM public.faculty);

-- ============================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: DROP ALL EXISTING CONFLICTING POLICIES
-- ============================================================

-- Drop all policies dynamically to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['profiles', 'students', 'universities', 'recruiters', 
                           'departments', 'faculty', 'admin_staff', 'courses', 
                           'course_enrollments', 'assignments', 'assignment_submissions',
                           'student_projects', 'academic_records', 'badges', 'user_badges',
                           'credentials', 'jobs', 'job_applications', 'notifications'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies 
                  WHERE schemaname = 'public' AND tablename = tbl)
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- PART 5: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================

-- Function to get faculty ID for current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT id FROM public.faculty 
        WHERE profile_id = auth.uid()
        LIMIT 1
    );
END;
$$;

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (role IN ('admin', 'university') OR user_type IN ('admin', 'university'))
    );
END;
$$;

-- Function to get student courses (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_student_course_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT course_id FROM public.course_enrollments
    WHERE student_id = auth.uid();
END;
$$;

-- ============================================================
-- PART 6: CREATE COMPREHENSIVE RLS POLICIES
-- ============================================================

-- PROFILES TABLE
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- STUDENTS TABLE
CREATE POLICY "students_select_all" ON public.students FOR SELECT USING (true);
CREATE POLICY "students_update_own" ON public.students FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "students_insert_own" ON public.students FOR INSERT WITH CHECK (auth.uid() = id);

-- UNIVERSITIES TABLE
CREATE POLICY "universities_select_all" ON public.universities FOR SELECT USING (true);
CREATE POLICY "universities_update_own" ON public.universities FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "universities_insert_own" ON public.universities FOR INSERT WITH CHECK (auth.uid() = id);

-- RECRUITERS TABLE
CREATE POLICY "recruiters_select_all" ON public.recruiters FOR SELECT USING (true);
CREATE POLICY "recruiters_update_own" ON public.recruiters FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "recruiters_insert_own" ON public.recruiters FOR INSERT WITH CHECK (auth.uid() = id);

-- DEPARTMENTS TABLE
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments_insert_university" ON public.departments FOR INSERT 
  WITH CHECK (public.is_user_admin());
CREATE POLICY "departments_update_university" ON public.departments FOR UPDATE 
  USING (public.is_user_admin());

-- FACULTY TABLE
CREATE POLICY "faculty_select_all" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "faculty_update_own" ON public.faculty FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "faculty_insert_university" ON public.faculty FOR INSERT 
  WITH CHECK (public.is_user_admin());

-- ADMIN_STAFF TABLE
CREATE POLICY "admin_staff_select_all" ON public.admin_staff FOR SELECT USING (public.is_user_admin());
CREATE POLICY "admin_staff_update_own" ON public.admin_staff FOR UPDATE USING (profile_id = auth.uid());

-- COURSES TABLE (NO RECURSION)
CREATE POLICY "courses_select_instructor" ON public.courses FOR SELECT
  USING (instructor_id = public.get_current_faculty_id());
  
CREATE POLICY "courses_select_enrolled" ON public.courses FOR SELECT
  USING (id IN (SELECT public.get_student_course_ids()));
  
CREATE POLICY "courses_select_admin" ON public.courses FOR SELECT
  USING (public.is_user_admin());
  
CREATE POLICY "courses_update_instructor" ON public.courses FOR UPDATE
  USING (instructor_id = public.get_current_faculty_id());

CREATE POLICY "courses_insert_admin" ON public.courses FOR INSERT
  WITH CHECK (public.is_user_admin());

-- COURSE_ENROLLMENTS TABLE
CREATE POLICY "enrollments_select_student" ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid());
  
CREATE POLICY "enrollments_select_instructor" ON public.course_enrollments FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "enrollments_select_admin" ON public.course_enrollments FOR SELECT
  USING (public.is_user_admin());

CREATE POLICY "enrollments_insert_student" ON public.course_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ASSIGNMENTS TABLE
CREATE POLICY "assignments_select_instructor" ON public.assignments FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "assignments_select_student" ON public.assignments FOR SELECT
  USING (course_id IN (SELECT public.get_student_course_ids()));
  
CREATE POLICY "assignments_insert_instructor" ON public.assignments FOR INSERT
  WITH CHECK (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "assignments_update_instructor" ON public.assignments FOR UPDATE
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "assignments_delete_instructor" ON public.assignments FOR DELETE
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));

-- ASSIGNMENT_SUBMISSIONS TABLE
CREATE POLICY "submissions_select_student" ON public.assignment_submissions FOR SELECT
  USING (student_id = auth.uid());
  
CREATE POLICY "submissions_select_instructor" ON public.assignment_submissions FOR SELECT
  USING (assignment_id IN (
    SELECT a.id FROM public.assignments a 
    WHERE a.course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id())
  ));
  
CREATE POLICY "submissions_insert_student" ON public.assignment_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());
  
CREATE POLICY "submissions_update_student" ON public.assignment_submissions FOR UPDATE
  USING (student_id = auth.uid());
  
CREATE POLICY "submissions_update_instructor" ON public.assignment_submissions FOR UPDATE
  USING (assignment_id IN (
    SELECT a.id FROM public.assignments a 
    WHERE a.course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id())
  ));

-- STUDENT_PROJECTS TABLE
CREATE POLICY "projects_select_own" ON public.student_projects FOR SELECT
  USING (student_id = auth.uid() OR student_id = ANY(student_ids::uuid[]));
  
CREATE POLICY "projects_select_instructor" ON public.student_projects FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "projects_insert_student" ON public.student_projects FOR INSERT
  WITH CHECK (student_id = auth.uid());
  
CREATE POLICY "projects_update_own" ON public.student_projects FOR UPDATE
  USING (student_id = auth.uid());

-- ACADEMIC_RECORDS TABLE
CREATE POLICY "academic_select_own" ON public.academic_records FOR SELECT
  USING (student_id = auth.uid());
  
CREATE POLICY "academic_select_instructor" ON public.academic_records FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));
  
CREATE POLICY "academic_insert_instructor" ON public.academic_records FOR INSERT
  WITH CHECK (course_id IN (SELECT id FROM public.courses WHERE instructor_id = public.get_current_faculty_id()));

-- BADGES TABLE
CREATE POLICY "badges_select_all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges_insert_university" ON public.badges FOR INSERT
  WITH CHECK (public.is_user_admin());

-- USER_BADGES TABLE
CREATE POLICY "user_badges_select_own" ON public.user_badges FOR SELECT
  USING (user_id = auth.uid() OR verified = true);
CREATE POLICY "user_badges_insert_own" ON public.user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- CREDENTIALS TABLE
CREATE POLICY "credentials_select_own" ON public.credentials FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "credentials_insert_own" ON public.credentials FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "credentials_update_own" ON public.credentials FOR UPDATE
  USING (user_id = auth.uid());

-- JOBS TABLE
CREATE POLICY "jobs_select_active" ON public.jobs FOR SELECT
  USING (status = 'active' OR recruiter_id = auth.uid());
CREATE POLICY "jobs_insert_recruiter" ON public.jobs FOR INSERT
  WITH CHECK (recruiter_id = auth.uid());
CREATE POLICY "jobs_update_recruiter" ON public.jobs FOR UPDATE
  USING (recruiter_id = auth.uid());

-- JOB_APPLICATIONS TABLE
CREATE POLICY "applications_select_own" ON public.job_applications FOR SELECT
  USING (
    student_id = auth.uid() OR 
    job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid())
  );
CREATE POLICY "applications_insert_student" ON public.job_applications FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "applications_update_recruiter" ON public.job_applications FOR UPDATE
  USING (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));

-- NOTIFICATIONS TABLE
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- PART 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_faculty_profile_id ON public.faculty(profile_id);
CREATE INDEX IF NOT EXISTS idx_faculty_university_id ON public.faculty(university_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON public.faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);

-- ============================================================
-- PART 8: VERIFICATION QUERIES
-- ============================================================

-- Check faculty table structure
SELECT 
    'Faculty Table Columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'faculty'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments')
ORDER BY tablename;

-- Check policy count per table
SELECT 
    'Policy Count' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check for orphaned faculty records
SELECT 
    'Orphaned Faculty' as check_type,
    COUNT(*) as count
FROM public.faculty f
WHERE f.profile_id IS NULL 
   OR f.profile_id NOT IN (SELECT id FROM auth.users);

-- Check for orphaned courses
SELECT 
    'Orphaned Courses' as check_type,
    COUNT(*) as count
FROM public.courses c
WHERE c.instructor_id IS NOT NULL
  AND c.instructor_id NOT IN (SELECT id FROM public.faculty);

-- Test helper functions
SELECT 
    'Helper Functions' as check_type,
    public.get_current_faculty_id() as my_faculty_id,
    public.is_user_admin() as am_i_admin;

-- Test courses query for current user
SELECT 
    'My Courses' as check_type,
    c.code,
    c.name,
    c.total_students
FROM public.courses c
LIMIT 5;

SELECT '✓ AUDIT AND FIX COMPLETE' as status;
