-- Harbor Platform Database Schema
-- Run this in Supabase SQL Editor to create all necessary tables

-- =============================================
-- USERS & PROFILES
-- =============================================

-- Extended user profiles (auth.users is managed by Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'university', 'recruiter', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student specific data
CREATE TABLE IF NOT EXISTS public.students (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  university TEXT,
  major TEXT,
  graduation_year TEXT,
  gpa DECIMAL(3,2),
  skills TEXT[],
  bio TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT
);

-- University specific data
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  university_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  website TEXT,
  accreditation TEXT,
  total_students INTEGER DEFAULT 0,
  total_faculty INTEGER DEFAULT 0
);

-- Recruiter specific data
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  company TEXT NOT NULL,
  job_title TEXT,
  company_size TEXT,
  industry TEXT,
  company_website TEXT
);

-- =============================================
-- BADGES & CREDENTIALS
-- =============================================

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('technical', 'soft-skill', 'academic', 'certification', 'achievement')),
  issuer_id UUID REFERENCES public.profiles(id),
  issuer_type TEXT CHECK (issuer_type IN ('university', 'organization', 'platform')),
  icon_url TEXT,
  criteria TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verification_hash TEXT,
  metadata JSONB,
  UNIQUE(user_id, badge_id)
);

-- Credentials (degrees, certificates, etc.)
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('degree', 'certificate', 'diploma', 'license', 'course')),
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  blockchain_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- JOBS & APPLICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT[],
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_min INTEGER,
  salary_max INTEGER,
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  skills_required TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted')),
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

-- =============================================
-- ANALYTICS & ACTIVITY
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL,
  stat_value JSONB,
  period TEXT, -- 'daily', 'weekly', 'monthly'
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT CHECK (category IN ('badge', 'job', 'application', 'system', 'message')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON public.credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student_id ON public.job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Students: Public read, own update
CREATE POLICY "Student profiles are viewable by everyone"
  ON public.students FOR SELECT
  USING (true);

CREATE POLICY "Students can update own data"
  ON public.students FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Students can insert own data"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Universities: Public read, own update
CREATE POLICY "University profiles are viewable by everyone"
  ON public.universities FOR SELECT
  USING (true);

CREATE POLICY "Universities can update own data"
  ON public.universities FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Universities can insert own data"
  ON public.universities FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recruiters: Public read, own update
CREATE POLICY "Recruiter profiles are viewable by everyone"
  ON public.recruiters FOR SELECT
  USING (true);

CREATE POLICY "Recruiters can update own data"
  ON public.recruiters FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Recruiters can insert own data"
  ON public.recruiters FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Badges: Everyone can read, universities can create
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Universities can create badges"
  ON public.badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type IN ('university', 'admin')
    )
  );

-- User Badges: Users can read own badges, others can read verified badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id OR verified = true);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs: Everyone can read active jobs, recruiters manage own jobs
CREATE POLICY "Active jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (status = 'active' OR auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = recruiter_id);

-- Job Applications: Students can apply, recruiters can view applications for their jobs
CREATE POLICY "Users can view own applications"
  ON public.job_applications FOR SELECT
  USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT recruiter_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Students can apply to jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Notifications: Users can only see own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_type'
  );
  
  -- Insert into specific table based on user type
  IF NEW.raw_user_meta_data->>'user_type' = 'student' THEN
    IF COALESCE((NEW.raw_user_meta_data->>'created_by_university')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Student self-registration is disabled. Student accounts must be created by a university administrator.';
    END IF;

    INSERT INTO public.students (id, university, major, graduation_year)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'university',
      NEW.raw_user_meta_data->>'major',
      NEW.raw_user_meta_data->>'graduation_year'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'university' THEN
    INSERT INTO public.universities (id, university_name, address, city, country)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'university_name',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'country'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'recruiter' THEN
    INSERT INTO public.recruiters (id, company, job_title)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company',
      NEW.raw_user_meta_data->>'job_title'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample badges
INSERT INTO public.badges (name, description, category, issuer_type, points) VALUES
  ('JavaScript Master', 'Completed advanced JavaScript course', 'technical', 'platform', 100),
  ('Team Player', 'Demonstrated excellent collaboration skills', 'soft-skill', 'platform', 50),
  ('React Expert', 'Built 5+ production React applications', 'technical', 'platform', 150),
  ('Leadership', 'Led a team of 5+ developers', 'soft-skill', 'platform', 75),
  ('Bachelor Degree', 'Completed undergraduate studies', 'academic', 'university', 200)
ON CONFLICT DO NOTHING;
