-- Database Schema Updates for Existing Tables
-- Run this to add missing columns to existing tables

-- =============================================
-- UPDATE JOBS TABLE
-- =============================================

-- Add missing columns to jobs table
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT[],
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS application_deadline DATE,
  ADD COLUMN IF NOT EXISTS remote_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS benefits TEXT[],
  ADD COLUMN IF NOT EXISTS required_badges TEXT[];

-- Update company column to company_name if needed
UPDATE public.jobs SET company_name = company WHERE company_name IS NULL AND company IS NOT NULL;

-- =============================================
-- UPDATE STUDENTS TABLE  
-- =============================================

-- Add missing fields to students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS resume_hash TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS enrollment_status TEXT CHECK (enrollment_status IN ('active', 'graduated', 'suspended', 'withdrawn')),
  ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,2);

-- =============================================
-- UPDATE BADGES TABLE
-- =============================================

-- Add missing fields to badges table
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS skills TEXT[],
  ADD COLUMN IF NOT EXISTS issuer TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT[],
  ADD COLUMN IF NOT EXISTS validity_period INTEGER, -- in months, NULL means no expiry
  ADD COLUMN IF NOT EXISTS badge_level TEXT CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum'));

-- =============================================
-- UPDATE USER_BADGES TABLE
-- =============================================

-- Add fields for badge verification
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS issuer_signature TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS verification_url TEXT;

-- =============================================
-- UPDATE PROFILES TABLE
-- =============================================

-- Add missing universal fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- =============================================
-- CREATE MISSING INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON public.jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON public.jobs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_status ON public.students(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);

-- =============================================
-- FUNCTION TO GET AVAILABLE SKILLS
-- =============================================

-- Create a materialized view for common skills
CREATE MATERIALIZED VIEW IF NOT EXISTS common_skills AS
SELECT 
  skill_name,
  COUNT(*) as user_count,
  skill_category
FROM public.user_skills
GROUP BY skill_name, skill_category
ORDER BY user_count DESC
LIMIT 100;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_common_skills()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW common_skills;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION TO GET AVAILABLE BADGES
-- =============================================

CREATE OR REPLACE VIEW available_badges AS
SELECT 
  b.id,
  b.name,
  b.description,
  b.category,
  b.issuer,
  COUNT(ub.id) as total_earned
FROM public.badges b
LEFT JOIN public.user_badges ub ON ub.badge_id = b.id
GROUP BY b.id, b.name, b.description, b.category, b.issuer
ORDER BY total_earned DESC;

-- =============================================
-- SEED DATA FOR COMMON SKILLS
-- =============================================

-- Insert common programming skills if user_skills table is empty
INSERT INTO public.user_skills (user_id, skill_name, skill_category, proficiency_level, status)
SELECT 
  (SELECT id FROM public.profiles WHERE user_type = 'admin' LIMIT 1) as user_id,
  skill,
  'programming' as skill_category,
  0 as proficiency_level,
  'learning' as status
FROM (
  VALUES 
    ('JavaScript'), ('TypeScript'), ('Python'), ('Java'), ('C++'),
    ('React'), ('Node.js'), ('Angular'), ('Vue.js'), ('Next.js'),
    ('PostgreSQL'), ('MongoDB'), ('Redis'), ('MySQL'), ('Docker'),
    ('Kubernetes'), ('AWS'), ('Azure'), ('GCP'), ('Git'),
    ('GraphQL'), ('REST API'), ('Microservices'), ('CI/CD'), ('Testing')
) AS t(skill)
WHERE NOT EXISTS (SELECT 1 FROM public.user_skills LIMIT 1)
ON CONFLICT DO NOTHING;
