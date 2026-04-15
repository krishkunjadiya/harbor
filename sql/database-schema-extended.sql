-- Additional Database Tables for Harbor Platform
-- Run this after the main database-schema.sql
-- 
-- IMPORTANT: If you get errors about existing tables, run the cleanup section first

-- =============================================
-- OPTIONAL: DROP EXISTING TABLES (Uncomment if needed)
-- =============================================
-- WARNING: This will delete all data! Only use for fresh migration
/*
DROP TABLE IF EXISTS public.career_insights CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.student_full_records CASCADE;
DROP TABLE IF EXISTS public.academic_records CASCADE;
DROP TABLE IF EXISTS public.student_projects CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.admin_staff CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
*/

-- =============================================
-- UNIVERSITY STRUCTURE
-- =============================================

-- Departments table (must be created first - referenced by other tables)
CREATE TABLE IF NOT EXISTS public.departments (
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

-- Faculty table
CREATE TABLE IF NOT EXISTS public.faculty (
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

-- Admin Staff table
CREATE TABLE IF NOT EXISTS public.admin_staff (
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

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
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

-- Student Projects/Capstones table
CREATE TABLE IF NOT EXISTS public.student_projects (
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

-- Academic Records table
CREATE TABLE IF NOT EXISTS public.academic_records (
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

-- Student Full Records (transcript-like)
CREATE TABLE IF NOT EXISTS public.student_full_records (
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

-- User Skills (detailed)
CREATE TABLE IF NOT EXISTS public.user_skills (
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

-- Career Insights table
CREATE TABLE IF NOT EXISTS public.career_insights (
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

-- =============================================
-- INDEXES FOR PERFORMANCE
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_full_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_insights ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Users can view departments from their university"
  ON public.departments FOR SELECT
  USING (true); -- Anyone can view departments

CREATE POLICY "Universities can manage their departments"
  ON public.departments FOR ALL
  USING (university_id = auth.uid());

-- Faculty policies
CREATE POLICY "Anyone can view faculty"
  ON public.faculty FOR SELECT
  USING (true);

CREATE POLICY "Universities can manage faculty"
  ON public.faculty FOR ALL
  USING (university_id = auth.uid());

-- Admin Staff policies
CREATE POLICY "Anyone can view admin staff"
  ON public.admin_staff FOR SELECT
  USING (true);

CREATE POLICY "Universities can manage admin staff"
  ON public.admin_staff FOR ALL
  USING (university_id = auth.uid());

-- Courses policies
CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (status = 'active' OR auth.uid() IS NOT NULL);

CREATE POLICY "Instructors can manage their courses"
  ON public.courses FOR ALL
  USING (instructor_id IN (
    SELECT id FROM public.faculty WHERE profile_id = auth.uid()
  ));

-- Student Projects policies
CREATE POLICY "Students can view their projects"
  ON public.student_projects FOR SELECT
  USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Students can manage their projects"
  ON public.student_projects FOR ALL
  USING (student_id = auth.uid());

-- Academic Records policies
CREATE POLICY "Students can view their records"
  ON public.academic_records FOR SELECT
  USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Universities can manage academic records"
  ON public.academic_records FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Student Full Records policies
CREATE POLICY "Students can view their full records"
  ON public.student_full_records FOR SELECT
  USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Universities can manage student records"
  ON public.student_full_records FOR ALL
  USING (auth.uid() IS NOT NULL);

-- User Skills policies
CREATE POLICY "Users can view their skills"
  ON public.user_skills FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their skills"
  ON public.user_skills FOR ALL
  USING (user_id = auth.uid());

-- Career Insights policies
CREATE POLICY "Students can view their career insights"
  ON public.career_insights FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can manage career insights"
  ON public.career_insights FOR ALL
  USING (auth.uid() IS NOT NULL);
