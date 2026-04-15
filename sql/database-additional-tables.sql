-- Additional Database Tables for Harbor Platform
-- Run this after database-schema.sql to add missing tables

-- =============================================
-- COURSES & ACADEMIC MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  semester TEXT,
  year INTEGER,
  credits INTEGER DEFAULT 3,
  max_students INTEGER DEFAULT 40,
  enrolled_students INTEGER DEFAULT 0,
  schedule TEXT,
  room TEXT,
  faculty_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_id, course_code, semester, year)
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'withdrawn')),
  grade TEXT,
  gpa_points DECIMAL(3,2),
  UNIQUE(course_id, student_id)
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_points INTEGER DEFAULT 100,
  weight DECIMAL(5,2) DEFAULT 1.0,
  assignment_type TEXT CHECK (assignment_type IN ('homework', 'quiz', 'exam', 'project', 'lab')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES public.profiles(id),
  UNIQUE(assignment_id, student_id)
);

-- =============================================
-- STUDENT PROJECTS & CAPSTONES
-- =============================================

CREATE TABLE IF NOT EXISTS public.student_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('capstone', 'research', 'personal', 'hackathon', 'internship')),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold')),
  github_url TEXT,
  demo_url TEXT,
  technologies TEXT[],
  team_members TEXT[],
  supervisor_id UUID REFERENCES public.profiles(id),
  grade TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'university-only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.student_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACADEMIC RECORDS
-- =============================================

CREATE TABLE IF NOT EXISTS public.academic_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  year INTEGER NOT NULL,
  grade TEXT,
  gpa_points DECIMAL(3,2),
  credits INTEGER,
  status TEXT CHECK (status IN ('in-progress', 'completed', 'failed', 'withdrawn')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester, year)
);

-- Transcripts (aggregated view)
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  cumulative_gpa DECIMAL(3,2),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  academic_standing TEXT CHECK (academic_standing IN ('good', 'probation', 'suspension', 'honors')),
  expected_graduation DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SKILLS MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT CHECK (skill_category IN ('programming', 'soft', 'tools', 'domain', 'language')),
  proficiency_level INTEGER CHECK (proficiency_level >= 0 AND proficiency_level <= 100),
  status TEXT CHECK (status IN ('expert', 'intermediate', 'learning')),
  verified BOOLEAN DEFAULT FALSE,
  years_experience DECIMAL(3,1),
  endorsements INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- Skill endorsements
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID REFERENCES public.user_skills(id) ON DELETE CASCADE,
  endorsed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, endorsed_by)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_faculty_id ON public.courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_student_id ON public.student_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON public.academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_course_id ON public.academic_records(course_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_category ON public.user_skills(skill_category);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Courses: Public read, faculty/university can manage
CREATE POLICY "Courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Faculty can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    auth.uid() = faculty_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('university', 'admin'))
  );

CREATE POLICY "Faculty can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = faculty_id OR auth.uid() = university_id);

-- Enrollments: Students can enroll, view own enrollments
CREATE POLICY "Users can view enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    auth.uid() = student_id OR
    auth.uid() IN (SELECT faculty_id FROM public.courses WHERE id = course_id)
  );

CREATE POLICY "Students can enroll in courses"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Assignments: Students in course can view, faculty can manage
CREATE POLICY "Course students can view assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = assignments.course_id AND student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND faculty_id = auth.uid())
  );

CREATE POLICY "Faculty can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND faculty_id = auth.uid())
  );

-- Student projects: Public or private based on visibility
CREATE POLICY "Public projects are viewable"
  ON public.student_projects FOR SELECT
  USING (
    visibility = 'public' OR
    auth.uid() = student_id OR
    auth.uid() = supervisor_id
  );

CREATE POLICY "Students can create own projects"
  ON public.student_projects FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own projects"
  ON public.student_projects FOR UPDATE
  USING (auth.uid() = student_id);

-- Academic records: Students can view own, faculty can manage
CREATE POLICY "Students can view own academic records"
  ON public.academic_records FOR SELECT
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = academic_records.course_id AND faculty_id = auth.uid()
    )
  );

-- User skills: Users manage own skills
CREATE POLICY "Users can view all skills"
  ON public.user_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own skills"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Skill endorsements: Users can endorse others' skills
CREATE POLICY "Users can view endorsements"
  ON public.skill_endorsements FOR SELECT
  USING (true);

CREATE POLICY "Users can endorse others"
  ON public.skill_endorsements FOR INSERT
  WITH CHECK (auth.uid() = endorsed_by);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_projects_updated_at BEFORE UPDATE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_records_updated_at BEFORE UPDATE ON public.academic_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update enrolled students count when enrollment happens
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses 
    SET enrolled_students = enrolled_students + 1 
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses 
    SET enrolled_students = GREATEST(0, enrolled_students - 1)
    WHERE id = OLD.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_count_on_insert
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_enrollment_count();

CREATE TRIGGER update_enrollment_count_on_delete
  AFTER DELETE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_enrollment_count();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Student course progress view
CREATE OR REPLACE VIEW student_course_progress AS
SELECT 
  ce.student_id,
  ce.course_id,
  c.course_name,
  c.course_code,
  c.semester,
  COUNT(DISTINCT a.id) as total_assignments,
  COUNT(DISTINCT asub.id) as completed_assignments,
  AVG(asub.grade) as average_grade,
  ce.status as enrollment_status
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
LEFT JOIN assignments a ON a.course_id = c.id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = ce.student_id
GROUP BY ce.student_id, ce.course_id, c.course_name, c.course_code, c.semester, ce.status;

-- Faculty teaching load view
CREATE OR REPLACE VIEW faculty_teaching_load AS
SELECT 
  c.faculty_id,
  COUNT(DISTINCT c.id) as total_courses,
  SUM(c.enrolled_students) as total_students,
  c.semester,
  c.year
FROM courses c
GROUP BY c.faculty_id, c.semester, c.year;
