-- SAFE Database Migration Script for Harbor Platform
-- This script checks for existing tables and handles them properly

-- =============================================
-- STEP 1: Check what already exists
-- =============================================

-- Run this first to see what tables you have:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY table_name;

-- =============================================
-- STEP 2: Drop existing tables if needed
-- =============================================

-- UNCOMMENTED: This will delete existing tables and recreate them properly
-- Required because previous migration created tables with wrong schema

DROP TABLE IF EXISTS public.career_insights CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.student_full_records CASCADE;
DROP TABLE IF EXISTS public.academic_records CASCADE;
DROP TABLE IF EXISTS public.student_projects CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.admin_staff CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- =============================================
-- STEP 3: Create tables in correct order
-- =============================================

-- Table 1: Departments (no dependencies)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'departments'
  ) THEN
    CREATE TABLE public.departments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      university_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      head_of_department TEXT,
      established TEXT,
      description TEXT,
      total_students INTEGER DEFAULT 0,
      total_faculty INTEGER DEFAULT 0,
      total_courses INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(university_id, code)
    );
    RAISE NOTICE 'Created table: departments';
  ELSE
    RAISE NOTICE 'Table already exists: departments';
  END IF;
END $$;

-- Table 2: Faculty (depends on departments)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'faculty'
  ) THEN
    CREATE TABLE public.faculty (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      university_id UUID REFERENCES public.profiles(id),
      department_id UUID REFERENCES public.departments(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      position TEXT,
      specialization TEXT,
      join_date DATE,
      total_courses INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: faculty';
  ELSE
    RAISE NOTICE 'Table already exists: faculty';
  END IF;
END $$;

-- Table 3: Admin Staff (no dependencies)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_staff'
  ) THEN
    CREATE TABLE public.admin_staff (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      university_id UUID REFERENCES public.profiles(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      department TEXT,
      position TEXT,
      responsibilities TEXT,
      join_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: admin_staff';
  ELSE
    RAISE NOTICE 'Table already exists: admin_staff';
  END IF;
END $$;

-- Table 4: Courses (depends on departments, faculty)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) THEN
    CREATE TABLE public.courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
      instructor_id UUID REFERENCES public.faculty(id),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      credits INTEGER DEFAULT 3,
      semester TEXT,
      year TEXT,
      total_students INTEGER DEFAULT 0,
      max_students INTEGER,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(department_id, code, semester, year)
    );
    RAISE NOTICE 'Created table: courses';
  ELSE
    RAISE NOTICE 'Table already exists: courses';
  END IF;
END $$;

-- Table 5: Student Projects (depends on courses)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_projects'
  ) THEN
    CREATE TABLE public.student_projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      course_id UUID REFERENCES public.courses(id),
      title TEXT NOT NULL,
      description TEXT,
      course_name TEXT,
      team_members TEXT[],
      student_ids TEXT[],
      mentor TEXT,
      status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'submitted', 'graded', 'archived')),
      progress INTEGER DEFAULT 0,
      start_date DATE,
      end_date DATE,
      presentation_date DATE,
      tags TEXT[],
      grade DECIMAL(5,2),
      technologies TEXT[],
      github_url TEXT,
      demo_url TEXT,
      proposal_status TEXT DEFAULT 'pending',
      midterm_status TEXT DEFAULT 'pending',
      final_status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: student_projects';
  ELSE
    RAISE NOTICE 'Table already exists: student_projects';
  END IF;
END $$;

-- Table 6: Academic Records (depends on courses)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'academic_records'
  ) THEN
    CREATE TABLE public.academic_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      course_id UUID REFERENCES public.courses(id),
      student_name TEXT,
      course_code TEXT,
      course_name TEXT,
      semester TEXT,
      year TEXT,
      grade TEXT,
      credits INTEGER,
      verified BOOLEAN DEFAULT FALSE,
      submitted_date DATE,
      verified_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: academic_records';
  ELSE
    RAISE NOTICE 'Table already exists: academic_records';
  END IF;
END $$;

-- Table 7: Student Full Records (no dependencies)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_full_records'
  ) THEN
    CREATE TABLE public.student_full_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      student_name TEXT,
      student_email TEXT,
      enrollment_id TEXT,
      department TEXT,
      semester TEXT,
      year TEXT,
      gpa DECIMAL(3,2),
      credits_earned INTEGER DEFAULT 0,
      courses JSONB,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: student_full_records';
  ELSE
    RAISE NOTICE 'Table already exists: student_full_records';
  END IF;
END $$;

-- Table 8: User Skills (no dependencies)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_skills'
  ) THEN
    CREATE TABLE public.user_skills (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      skill_name TEXT NOT NULL,
      skill_category TEXT,
      proficiency_level INTEGER DEFAULT 50,
      verified BOOLEAN DEFAULT FALSE,
      endorsements INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, skill_name)
    );
    RAISE NOTICE 'Created table: user_skills';
  ELSE
    RAISE NOTICE 'Table already exists: user_skills';
  END IF;
END $$;

-- Table 9: Career Insights (no dependencies)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'career_insights'
  ) THEN
    CREATE TABLE public.career_insights (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      readiness_score INTEGER DEFAULT 0,
      skills_match INTEGER DEFAULT 0,
      experience_level INTEGER DEFAULT 0,
      profile_completeness INTEGER DEFAULT 0,
      recommended_jobs JSONB,
      salary_insights JSONB,
      skill_trends JSONB,
      career_paths JSONB,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: career_insights';
  ELSE
    RAISE NOTICE 'Table already exists: career_insights';
  END IF;
END $$;

-- =============================================
-- STEP 4: Create indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_departments_university_id ON public.departments(university_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_faculty_university_id ON public.faculty(university_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON public.faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON public.faculty(email);
CREATE INDEX IF NOT EXISTS idx_admin_staff_university_id ON public.admin_staff(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_student_projects_student_id ON public.student_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_course_id ON public.student_projects(course_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_status ON public.student_projects(status);
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON public.academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_course_id ON public.academic_records(course_id);
CREATE INDEX IF NOT EXISTS idx_student_full_records_student_id ON public.student_full_records(student_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_career_insights_student_id ON public.career_insights(student_id);

-- =============================================
-- STEP 5: Enable RLS
-- =============================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_full_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_insights ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: Create RLS policies
-- =============================================

-- Departments policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Users can view departments from their university'
  ) THEN
    CREATE POLICY "Users can view departments from their university"
      ON public.departments FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Universities can manage their departments'
  ) THEN
    CREATE POLICY "Universities can manage their departments"
      ON public.departments FOR ALL
      USING (university_id = auth.uid());
  END IF;
END $$;

-- Faculty policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'faculty' AND policyname = 'Anyone can view faculty'
  ) THEN
    CREATE POLICY "Anyone can view faculty"
      ON public.faculty FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'faculty' AND policyname = 'Universities can manage faculty'
  ) THEN
    CREATE POLICY "Universities can manage faculty"
      ON public.faculty FOR ALL
      USING (university_id = auth.uid());
  END IF;
END $$;

-- Admin Staff policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'admin_staff' AND policyname = 'Anyone can view admin staff'
  ) THEN
    CREATE POLICY "Anyone can view admin staff"
      ON public.admin_staff FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'admin_staff' AND policyname = 'Universities can manage admin staff'
  ) THEN
    CREATE POLICY "Universities can manage admin staff"
      ON public.admin_staff FOR ALL
      USING (university_id = auth.uid());
  END IF;
END $$;

-- Courses policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Anyone can view active courses'
  ) THEN
    CREATE POLICY "Anyone can view active courses"
      ON public.courses FOR SELECT
      USING (status = 'active' OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Instructors can manage their courses'
  ) THEN
    CREATE POLICY "Instructors can manage their courses"
      ON public.courses FOR ALL
      USING (instructor_id IN (
        SELECT id FROM public.faculty WHERE profile_id = auth.uid()
      ));
  END IF;
END $$;

-- Student Projects policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'student_projects' AND policyname = 'Students can view their projects'
  ) THEN
    CREATE POLICY "Students can view their projects"
      ON public.student_projects FOR SELECT
      USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'student_projects' AND policyname = 'Students can manage their projects'
  ) THEN
    CREATE POLICY "Students can manage their projects"
      ON public.student_projects FOR ALL
      USING (student_id = auth.uid());
  END IF;
END $$;

-- Academic Records policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'academic_records' AND policyname = 'Students can view their records'
  ) THEN
    CREATE POLICY "Students can view their records"
      ON public.academic_records FOR SELECT
      USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'academic_records' AND policyname = 'Universities can manage academic records'
  ) THEN
    CREATE POLICY "Universities can manage academic records"
      ON public.academic_records FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Student Full Records policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'student_full_records' AND policyname = 'Students can view their full records'
  ) THEN
    CREATE POLICY "Students can view their full records"
      ON public.student_full_records FOR SELECT
      USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'student_full_records' AND policyname = 'Universities can manage student records'
  ) THEN
    CREATE POLICY "Universities can manage student records"
      ON public.student_full_records FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- User Skills policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_skills' AND policyname = 'Users can view their skills'
  ) THEN
    CREATE POLICY "Users can view their skills"
      ON public.user_skills FOR SELECT
      USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_skills' AND policyname = 'Users can manage their skills'
  ) THEN
    CREATE POLICY "Users can manage their skills"
      ON public.user_skills FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Career Insights policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'career_insights' AND policyname = 'Students can view their career insights'
  ) THEN
    CREATE POLICY "Students can view their career insights"
      ON public.career_insights FOR SELECT
      USING (student_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'career_insights' AND policyname = 'System can manage career insights'
  ) THEN
    CREATE POLICY "System can manage career insights"
      ON public.career_insights FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- =============================================
-- FINAL VERIFICATION
-- =============================================

-- Check all tables were created
SELECT 'TABLES CREATED:' as status, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
);

-- List all new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY table_name;
