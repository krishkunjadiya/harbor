// Database Types for Harbor Platform
import { User } from '@supabase/supabase-js'

export type UserType = 'student' | 'university' | 'recruiter' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  user_type: UserType
  role: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  university: string | null
  major: string | null
  graduation_year: string | null
  gpa: number | null
  skills: string[] | null
  bio: string | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  resume_score: number | null
  resume_feedback: Record<string, any> | null
}

export interface University {
  id: string
  university_name: string
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  accreditation: string | null
  total_students: number
  total_faculty: number
}

export interface Recruiter {
  id: string
  company: string
  job_title: string | null
  company_size: string | null
  industry: string | null
  company_website: string | null
  location: string | null
}

export type CredentialType = 'degree' | 'certificate' | 'diploma' | 'license' | 'course'

export interface Credential {
  id: string
  user_id: string
  type: CredentialType
  title: string
  institution: string
  issue_date: string | null
  expiry_date: string | null
  credential_id: string | null
  credential_url: string | null
  verified: boolean
  blockchain_hash: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead'
export type JobStatus = 'active' | 'closed' | 'draft'

export interface Job {
  id: string
  recruiter_id: string
  company: string
  title: string
  description: string | null
  requirements: string[] | null
  location: string | null
  job_type: JobType
  salary_min: number | null
  salary_max: number | null
  experience_level: ExperienceLevel
  skills_required: string[] | null
  status: JobStatus
  applications_count: number
  views_count: number
  created_at: string
  updated_at: string
}

export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'

export interface JobApplication {
  id: string
  job_id: string
  student_id: string
  status: ApplicationStatus
  cover_letter: string | null
  resume_url: string | null
  applied_at: string
  updated_at: string
  job?: Job // Joined job data
  student?: Profile & Student // Joined student data
}

export interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  description: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface DashboardStat {
  id: string
  user_id: string
  stat_type: string
  stat_value: Record<string, any>
  period: 'daily' | 'weekly' | 'monthly' | null
  date: string
  created_at: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'job' | 'application' | 'system' | 'message'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: NotificationType
  category: NotificationCategory
  read: boolean
  action_url: string | null
  created_at: string
}

// Combined types for dashboard views
export interface StudentDashboard {
  profile: Profile & Student
  credentials: Credential[]
  applications: JobApplication[]
  stats: {
    total_credentials: number
    applications_count: number
    profile_views: number
  }
}

export interface UniversityDashboard {
  profile: Profile & University
  stats: {
    total_students: number
    total_faculty: number
    total_departments: number
    credentials_issued: number
    active_recruiters: number
  }
  recent_credentials: Credential[]
}

export interface RecruiterDashboard {
  profile: Profile & Recruiter
  stats: {
    active_jobs: number
    total_applications: number
    shortlisted: number
    hired: number
  }
  jobs: Job[]
  recent_applications: JobApplication[]
}
