# ðŸš€ Supabase Import Guide - Harbor Student Management System

**Database:** PostgreSQL (Supabase)  
**Total Tables:** 28  
**Total Records:** ~1000+  
**Date:** January 31, 2026

---

## ðŸ“‹ Prerequisites

âœ… Supabase project created  
âœ… Database tables created (matching CSV schema)  
âœ… All CSV files validated and ready (in `seed-csv/` folder)  
âœ… Supabase CLI installed (optional, for bulk import)

---

## ðŸŽ¯ Method 1: Supabase Dashboard (Recommended for Small Datasets)

### Step 1: Access Your Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor** in the left sidebar

### Step 2: Import Using Table Editor UI

**For each table:**

1. Click on the table name (e.g., `universities`)
2. Click **"Insert"** â†’ **"Import data from CSV"**
3. Select your CSV file (e.g., `universities.csv`)
4. Supabase will auto-map columns
5. Review and click **"Import"**

**âš ï¸ IMPORTANT: Import in this order to maintain FK integrity:**

```
Order 1: Master Tables (No Dependencies)
â”œâ”€â”€ universities.csv
â”œâ”€â”€ departments.csv
â”œâ”€â”€ skills.csv
â””â”€â”€ Credentials.csv

Order 2: Profiles (Everything depends on this!)
â””â”€â”€ profiles.csv (143 records)

Order 3: User Tables
â”œâ”€â”€ students.csv (50 records)
â”œâ”€â”€ faculty.csv (50 records)
â”œâ”€â”€ recruiters.csv (50 records)
â””â”€â”€ admins.csv

Order 4: Core Entities
â”œâ”€â”€ courses.csv (50 records)
â”œâ”€â”€ jobs.csv (100 records)
â””â”€â”€ projects.csv

Order 5: Relationships & Transactions
â”œâ”€â”€ enrollments.csv
â”œâ”€â”€ assignments.csv
â”œâ”€â”€ grades.csv
â”œâ”€â”€ job_applications.csv
â”œâ”€â”€ user_skills.csv
â”œâ”€â”€ user_credentials.csv
â”œâ”€â”€ skill_endorsements.csv
â”œâ”€â”€ project_members.csv
â”œâ”€â”€ project_milestones.csv
â”œâ”€â”€ assignment_submissions.csv
â”œâ”€â”€ attendance.csv
â”œâ”€â”€ notifications.csv
â”œâ”€â”€ messages.csv
â”œâ”€â”€ chat_groups.csv
â”œâ”€â”€ chat_messages.csv
â””â”€â”€ user_transactions.csv

Order 6: Views/Aggregates
â”œâ”€â”€ career_insights.csv
â”œâ”€â”€ dashboard_stats.csv
â”œâ”€â”€ academic_records.csv
â”œâ”€â”€ student_full_records.csv
â””â”€â”€ transcripts.csv
```

---

## ðŸ”¥ Method 2: SQL Editor (Faster for Bulk Import)

### Step 1: Upload CSVs to Supabase Storage

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `csv-imports` (make it **public** temporarily)
3. Upload all CSV files from `seed-csv/` folder
4. Copy the public URL for each file

### Step 2: Run SQL Import Commands

Go to **SQL Editor** and run these commands **in order**:

```sql
-- ============================================
-- STEP 1: Import Master Tables
-- ============================================

-- Universities
COPY universities (university_id, name, country, state, city, established_year, website, logo_url, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/universities.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Departments
COPY departments (department_id, university_id, name, code, head_of_department, building, floor, room, phone, email, website, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/departments.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Skills
COPY skills (skill_id, skill_name, category, level, icon_url, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/skills.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Credentials
COPY Credentials (Credential_id, Credential_name, description, icon_url, criteria, points, level, category, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/Credentials.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- ============================================
-- STEP 2: Import Profiles (CRITICAL - Import First!)
-- ============================================

COPY profiles (profile_id, email, full_name, role, avatar_url, phone, created_at, last_login, timezone, language, updated_at, email_verified, status)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/profiles.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Verify: Should return 143
SELECT COUNT(*) FROM profiles;

-- ============================================
-- STEP 3: Import User Tables
-- ============================================

-- Students
COPY students (student_id, profile_id, enrollment_number, university_id, department_id, semester, cgpa, admission_date, graduation_date, status)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/students.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Faculty
COPY faculty (faculty_id, profile_id, employee_number, department, designation, joining_date, status)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/faculty.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Recruiters
COPY recruiters (recruiter_id, profile_id, company_email, company_name, joining_date, status)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/recruiters.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Admins
COPY admins (admin_id, profile_id, role, permissions, department, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/admins.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- ============================================
-- STEP 4: Import Core Entities
-- ============================================

-- Courses
COPY courses (course_id, university_id, department_id, course_code, course_name, description, semester, year, credits, max_students, enrolled_students, schedule, room, faculty_id, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/courses.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Jobs
COPY jobs (job_id, recruiter_id, company_name, job_title, job_description, location, job_type, experience_level, salary_range, skills_required, application_deadline, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/jobs.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Projects
COPY projects (project_id, project_name, description, student_id, course_id, start_date, end_date, status, github_url, demo_url, tech_stack, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/projects.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- ============================================
-- STEP 5: Import Relationships & Transactions
-- ============================================

-- Enrollments
COPY enrollments (enrollment_id, student_id, course_id, enrollment_date, status, grade, attendance_percentage, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/enrollments.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Assignments
COPY assignments (assignment_id, course_id, title, description, due_date, points, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/assignments.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Grades
COPY grades (grade_id, student_id, course_id, assignment_id, faculty_id, marks_obtained, total_marks, percentage, grade, feedback, graded_at, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/grades.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Job Applications
COPY job_applications (application_id, job_id, student_id, resume_url, cover_letter, application_date, status, recruiter_feedback, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/job_applications.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- User Skills
COPY user_skills (user_skill_id, student_id, skill_id, proficiency_level, years_of_experience, verified, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/user_skills.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- User Credentials
COPY user_credentials (user_Credential_id, student_id, Credential_id, earned_date, status, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/user_credentials.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Skill Endorsements
COPY skill_endorsements (endorsement_id, user_skill_id, endorser_id, endorser_type, comment, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/skill_endorsements.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Project Members
COPY project_members (member_id, project_id, student_id, role, joined_date, status)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/project_members.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Project Milestones
COPY project_milestones (milestone_id, project_id, title, description, due_date, status, completed_at, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/project_milestones.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Assignment Submissions
COPY assignment_submissions (submission_id, assignment_id, student_id, submission_url, submission_date, status, marks_obtained, feedback, graded_by, graded_at, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/assignment_submissions.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Attendance
COPY attendance (attendance_id, student_id, course_id, date, status, remarks, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/attendance.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Notifications
COPY notifications (notification_id, user_id, title, message, type, read, link, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/notifications.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Messages
COPY messages (message_id, sender_id, receiver_id, message, read, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/messages.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Chat Groups
COPY chat_groups (group_id, group_name, description, created_by, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/chat_groups.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Chat Messages
COPY chat_messages (message_id, group_id, sender_id, message, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/chat_messages.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- User Transactions
COPY user_transactions (transaction_id, user_id, transaction_type, amount, description, status, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/user_transactions.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- ============================================
-- STEP 6: Import Views/Aggregates (Optional)
-- ============================================

-- Career Insights
COPY career_insights (insight_id, student_id, job_market_score, skill_gap_analysis, recommended_skills, career_path, industry_trends, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/career_insights.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Dashboard Stats
COPY dashboard_stats (stat_id, user_id, total_courses, completed_courses, pending_assignments, average_grade, total_projects, total_Credentials, skill_count, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/dashboard_stats.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Academic Records
COPY academic_records (record_id, student_id, semester, cgpa, sgpa, total_credits, status, created_at, updated_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/academic_records.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Student Full Records
COPY student_full_records (record_id, student_id, enrollment_number, full_name, email, department, semester, cgpa, total_courses, completed_courses, pending_assignments, total_projects, total_Credentials, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/student_full_records.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- Transcripts
COPY transcripts (transcript_id, student_id, semester, course_code, course_name, credits, grade, points, created_at)
FROM PROGRAM 'curl "https://your-project.supabase.co/storage/v1/object/public/csv-imports/transcripts.csv"'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');
```

**Note:** Replace `https://your-project.supabase.co/storage/v1/object/public/csv-imports/` with your actual Supabase storage URLs.

---

## ðŸ› ï¸ Method 3: Using Supabase CLI (Fastest)

### Step 1: Install Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

### Step 4: Run Import Script

Create a PowerShell script `import-all.ps1`:

```powershell
# import-all.ps1
$csvFolder = "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv"
$projectRef = "your-project-ref"
$dbUrl = "postgresql://postgres:[PASSWORD]@db.$projectRef.supabase.co:5432/postgres"

# Import order matters!
$tables = @(
    "universities",
    "departments",
    "skills",
    "Credentials",
    "profiles",
    "students",
    "faculty",
    "recruiters",
    "admins",
    "courses",
    "jobs",
    "projects",
    "enrollments",
    "assignments",
    "grades",
    "job_applications",
    "user_skills",
    "user_credentials",
    "skill_endorsements",
    "project_members",
    "project_milestones",
    "assignment_submissions",
    "attendance",
    "notifications",
    "messages",
    "chat_groups",
    "chat_messages",
    "user_transactions",
    "career_insights",
    "dashboard_stats",
    "academic_records",
    "student_full_records",
    "transcripts"
)

foreach ($table in $tables) {
    $csvFile = Join-Path $csvFolder "$table.csv"
    Write-Host "Importing $table..." -ForegroundColor Cyan
    
    psql $dbUrl -c "\COPY $table FROM '$csvFile' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '\"')"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ… $table imported successfully" -ForegroundColor Green
    } else {
        Write-Host "âŒ Failed to import $table" -ForegroundColor Red
        break
    }
}

Write-Host "`nðŸŽ‰ All tables imported!" -ForegroundColor Green
```

Run it:

```powershell
cd "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv"
.\import-all.ps1
```

---

## âœ… Verification Queries

After import, run these in **SQL Editor** to verify:

```sql
-- Check row counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'recruiters', COUNT(*) FROM recruiters
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'grades', COUNT(*) FROM grades
ORDER BY table_name;

-- Expected Results:
-- profiles: 143
-- students: 50
-- faculty: 50
-- recruiters: 50
-- courses: 50
-- jobs: 100
-- enrollments: ~100
-- grades: ~100

-- Verify FK integrity (should all return 0)
SELECT 'orphaned_students' as check_name, COUNT(*) FROM students s
LEFT JOIN profiles p ON s.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_faculty', COUNT(*) FROM faculty f
LEFT JOIN profiles p ON f.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_recruiters', COUNT(*) FROM recruiters r
LEFT JOIN profiles p ON r.profile_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_jobs', COUNT(*) FROM jobs j
LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
WHERE r.recruiter_id IS NULL

UNION ALL

SELECT 'orphaned_courses', COUNT(*) FROM courses c
LEFT JOIN profiles p ON c.faculty_id = p.profile_id
WHERE p.profile_id IS NULL

UNION ALL

SELECT 'orphaned_grades', COUNT(*) FROM grades g
LEFT JOIN faculty f ON g.faculty_id = f.faculty_id
WHERE f.faculty_id IS NULL;

-- All should return 0!
```

---

## ðŸš¨ Troubleshooting

### Error: "Relation does not exist"
**Solution:** Create the table schema first. Check your table definitions match CSV columns.

### Error: "Duplicate key value violates unique constraint"
**Solution:** Tables already have data. Either truncate them first or skip import.

```sql
-- Truncate all tables (CAUTION: Deletes all data!)
TRUNCATE profiles, students, faculty, recruiters, courses, jobs CASCADE;
```

### Error: "Foreign key violation"
**Solution:** Import in the correct order (see Order 1-6 above). Profiles MUST be imported before students/faculty/recruiters.

### Error: "Permission denied"
**Solution:** Ensure your Supabase role has INSERT permissions. Check RLS policies.

```sql
-- Temporarily disable RLS for import (re-enable after!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ... do for all tables

-- After import, re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
```

### Error: "Invalid input syntax for type uuid"
**Solution:** Ensure UUIDs are properly formatted (lowercase, with hyphens). All CSVs are already validated.

---

## ðŸŽ¯ Quick Start Commands

### Option 1: Table Editor (Easiest)
1. Supabase Dashboard â†’ Table Editor
2. Select table â†’ Insert â†’ Import CSV
3. Upload file â†’ Import

### Option 2: SQL Editor (Fastest)
1. Upload CSVs to Supabase Storage
2. Copy SQL commands above
3. Replace URLs with your storage URLs
4. Run in SQL Editor

### Option 3: CLI (Most Powerful)
1. Install Supabase CLI
2. Run `import-all.ps1` script
3. Verify with queries

---

## ðŸ“Š Expected Results

After successful import:

| Table | Expected Rows |
|-------|---------------|
| profiles | 143 |
| students | 50 |
| faculty | 50 |
| recruiters | 50 |
| courses | 50 |
| jobs | 100 |
| universities | 2 |
| departments | ~20 |
| skills | ~50 |
| Credentials | ~20 |
| enrollments | ~100 |
| grades | ~100 |
| projects | ~30 |
| job_applications | ~100 |

**Total Records:** ~1000+

---

## ðŸ” Security Note

After import, remember to:
1. **Enable RLS** on all tables
2. **Remove public access** from CSV storage bucket
3. **Set up proper policies** for authenticated users
4. **Test access** with your application

---

## âœ… Success Checklist

- [ ] All CSV files uploaded
- [ ] Tables created with correct schema
- [ ] Data imported in correct order (1-6)
- [ ] Row counts verified
- [ ] FK integrity verified (0 orphaned records)
- [ ] RLS policies enabled
- [ ] Application connected successfully
- [ ] Test queries working

---

**Status: Ready to Import!** ðŸš€

All CSV files are production-ready with 100% referential integrity. Choose your preferred method and start importing!

