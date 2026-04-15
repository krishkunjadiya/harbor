-- Harbor Database Schema for Supabase
-- Run this in Supabase SQL Editor BEFORE importing CSVs
-- Date: January 31, 2026

-- ============================================
-- STEP 1: Create Master Tables
-- ============================================

-- Universities Table
CREATE TABLE IF NOT EXISTS universities (
    university_id VARCHAR(50) PRIMARY KEY,
    profile_id UUID NOT NULL,
    university_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    contact_email VARCHAR(255),
    established_year VARCHAR(4),
    status VARCHAR(20) DEFAULT 'active'
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(50) PRIMARY KEY,
    university_id VARCHAR(50) REFERENCES universities(university_id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    head_of_department VARCHAR(255),
    building VARCHAR(100),
    floor VARCHAR(10),
    room VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    skill_id VARCHAR(50) PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    level VARCHAR(50),
    icon_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
    badge_id VARCHAR(50) PRIMARY KEY,
    badge_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria TEXT,
    points INTEGER,
    level VARCHAR(50),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create Profiles Table (CRITICAL!)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    profile_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50),
    language VARCHAR(10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active'
);

-- ============================================
-- STEP 3: Create User Tables
-- ============================================

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    university_id VARCHAR(50) REFERENCES universities(university_id),
    department_id VARCHAR(50) REFERENCES departments(department_id),
    semester INTEGER,
    cgpa DECIMAL(3,2),
    admission_date DATE,
    graduation_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id VARCHAR(50) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(255),
    designation VARCHAR(100),
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Recruiters Table
CREATE TABLE IF NOT EXISTS recruiters (
    recruiter_id VARCHAR(50) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    company_email VARCHAR(255),
    company_name VARCHAR(255),
    joining_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    admin_id VARCHAR(50) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    role VARCHAR(100),
    permissions TEXT,
    department VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Core Entity Tables
-- ============================================

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id VARCHAR(50) PRIMARY KEY,
    university_id VARCHAR(50) REFERENCES universities(university_id),
    department_id VARCHAR(50) REFERENCES departments(department_id),
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    semester VARCHAR(20),
    year VARCHAR(4),
    credits INTEGER,
    max_students INTEGER,
    enrolled_students INTEGER,
    schedule VARCHAR(100),
    room VARCHAR(50),
    faculty_id UUID REFERENCES profiles(profile_id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    job_id VARCHAR(50) PRIMARY KEY,
    recruiter_id VARCHAR(50) REFERENCES recruiters(recruiter_id),
    company_name VARCHAR(255),
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT,
    location VARCHAR(255),
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    salary_range VARCHAR(100),
    skills_required TEXT,
    application_deadline DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    project_id VARCHAR(50) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    student_id VARCHAR(50) REFERENCES students(student_id),
    course_id VARCHAR(50) REFERENCES courses(course_id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    github_url VARCHAR(500),
    demo_url VARCHAR(500),
    tech_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create Relationship Tables
-- ============================================

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    course_id VARCHAR(50) REFERENCES courses(course_id),
    enrollment_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    grade VARCHAR(5),
    attendance_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) REFERENCES courses(course_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    points INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
    grade_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    course_id VARCHAR(50) REFERENCES courses(course_id),
    assignment_id VARCHAR(50) REFERENCES assignments(assignment_id),
    faculty_id VARCHAR(50) REFERENCES faculty(faculty_id),
    marks_obtained DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    application_id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(job_id),
    student_id VARCHAR(50) REFERENCES students(student_id),
    resume_url VARCHAR(500),
    cover_letter TEXT,
    application_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    recruiter_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
    user_skill_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    skill_id VARCHAR(50) REFERENCES skills(skill_id),
    proficiency_level VARCHAR(50),
    years_of_experience INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    user_badge_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    badge_id VARCHAR(50) REFERENCES badges(badge_id),
    earned_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill Endorsements Table
CREATE TABLE IF NOT EXISTS skill_endorsements (
    endorsement_id VARCHAR(50) PRIMARY KEY,
    user_skill_id VARCHAR(50) REFERENCES user_skills(user_skill_id),
    endorser_id VARCHAR(50),
    endorser_type VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
    member_id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(project_id),
    student_id VARCHAR(50) REFERENCES students(student_id),
    role VARCHAR(100),
    joined_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    milestone_id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(project_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    submission_id VARCHAR(50) PRIMARY KEY,
    assignment_id VARCHAR(50) REFERENCES assignments(assignment_id),
    student_id VARCHAR(50) REFERENCES students(student_id),
    submission_url VARCHAR(500),
    submission_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'submitted',
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    graded_by VARCHAR(50),
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    course_id VARCHAR(50) REFERENCES courses(course_id),
    date DATE,
    status VARCHAR(20),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES profiles(profile_id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    message_id VARCHAR(50) PRIMARY KEY,
    sender_id UUID REFERENCES profiles(profile_id),
    receiver_id UUID REFERENCES profiles(profile_id),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Groups Table
CREATE TABLE IF NOT EXISTS chat_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(profile_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES chat_groups(group_id),
    sender_id UUID REFERENCES profiles(profile_id),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Transactions Table
CREATE TABLE IF NOT EXISTS user_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES profiles(profile_id),
    transaction_type VARCHAR(50),
    amount DECIMAL(10,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 6: Create Views/Aggregate Tables
-- ============================================

-- Career Insights Table
CREATE TABLE IF NOT EXISTS career_insights (
    insight_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    job_market_score DECIMAL(5,2),
    skill_gap_analysis TEXT,
    recommended_skills TEXT,
    career_path TEXT,
    industry_trends TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard Stats Table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    stat_id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES profiles(profile_id),
    total_courses INTEGER,
    completed_courses INTEGER,
    pending_assignments INTEGER,
    average_grade DECIMAL(5,2),
    total_projects INTEGER,
    total_badges INTEGER,
    skill_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic Records Table
CREATE TABLE IF NOT EXISTS academic_records (
    record_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    semester INTEGER,
    cgpa DECIMAL(3,2),
    sgpa DECIMAL(3,2),
    total_credits INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Full Records Table
CREATE TABLE IF NOT EXISTS student_full_records (
    record_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    enrollment_number VARCHAR(50),
    full_name VARCHAR(255),
    email VARCHAR(255),
    department VARCHAR(255),
    semester INTEGER,
    cgpa DECIMAL(3,2),
    total_courses INTEGER,
    completed_courses INTEGER,
    pending_assignments INTEGER,
    total_projects INTEGER,
    total_badges INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts Table
CREATE TABLE IF NOT EXISTS transcripts (
    transcript_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    semester INTEGER,
    course_code VARCHAR(20),
    course_name VARCHAR(255),
    credits INTEGER,
    grade VARCHAR(5),
    points DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university_id);

-- Faculty indexes
CREATE INDEX IF NOT EXISTS idx_faculty_profile_id ON faculty(profile_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);

COMMENT ON TABLE profiles IS 'User profiles for all system users';
COMMENT ON TABLE students IS 'Student-specific information';
COMMENT ON TABLE faculty IS 'Faculty member information';
COMMENT ON TABLE recruiters IS 'Recruiter/Company representative information';
COMMENT ON TABLE courses IS 'Course catalog and scheduling';
COMMENT ON TABLE jobs IS 'Job postings from recruiters';
