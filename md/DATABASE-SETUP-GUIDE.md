# Database Setup Guide for Harbor Platform

## Overview
This guide contains all the SQL queries needed to set up the complete database schema for the Harbor platform.

## Setup Order

### 1. Base Schema (Run First)
File: `database-schema.sql`
- Creates core tables: profiles, students, universities, recruiters
- Creates Credentials, credentials, jobs, applications
- Sets up Row Level Security (RLS) policies
- Creates triggers for automatic updates

### 2. Additional Tables (Run Second)
File: `database-additional-tables.sql`  
- Creates courses and enrollments
- Creates assignments and submissions
- Creates student projects and capstones
- Creates academic records and transcripts
- Creates skills management tables

### 3. Schema Updates (Run Third)
File: `database-schema-updates.sql`
- Adds missing columns to existing tables
- Creates views for common queries
- Adds seed data for common skills

## Database Tables Summary

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| profiles | Base user info | id, email, full_name, user_type |
| students | Student-specific | university, major, gpa, skills, resume_url |
| universities | University-specific | university_name, total_students |
| recruiters | Recruiter-specific | company, job_title |

### Credentials & Credentials
| Table | Purpose | Key Fields |
|-------|---------|------------|
| Credentials | Credential definitions | name, description, issuer, criteria, skills |
| user_credentials | Earned Credentials | user_id, Credential_id, earned_at, verification_hash |
| credentials | Degrees/certificates | type, title, institution, verified |

### Jobs & Applications
| Table | Purpose | Key Fields |
|-------|---------|------------|
| jobs | Job postings | title, company_name, required_skills, salary_range |
| job_applications | Applications | job_id, student_id, status, resume_url |

### Academic Management
| Table | Purpose | Key Fields |
|-------|---------|------------|
| courses | Course catalog | course_code, course_name, semester, faculty_id |
| course_enrollments | Student enrollments | course_id, student_id, grade |
| assignments | Course assignments | course_id, title, due_date, max_points |
| assignment_submissions | Student submissions | assignment_id, student_id, grade |
| academic_records | Student grades | student_id, course_id, grade, gpa_points |
| transcripts | GPA summary | student_id, cumulative_gpa, total_credits |

### Projects & Skills
| Table | Purpose | Key Fields |
|-------|---------|------------|
| student_projects | Student projects | title, project_type, technologies, github_url |
| project_milestones | Project tracking | project_id, title, due_date, completed |
| user_skills | User skills | user_id, skill_name, proficiency_level, verified |
| skill_endorsements | Skill validations | skill_id, endorsed_by |

### Notifications
| Table | Purpose | Key Fields |
|-------|---------|------------|
| notifications | User notifications | user_id, title, message, type, read |
| user_activity | Activity log | user_id, activity_type, metadata |

## Available Database Functions

All functions are in `lib/actions/database.ts`:

### User & Profile
```typescript
getUserById(userId: string)
getCurrentUserProfile()
getStudentProfile(userId: string)
getUniversityProfile(userId: string)
getRecruiterProfile(userId: string)
```

### Dashboards
```typescript
getStudentDashboard(userId: string)
getUniversityDashboard(userId: string)
getRecruiterDashboard(userId: string)
```

### Credentials
```typescript
getUserCredentials(userId: string)
getAllCredentials()
getCredentialById(CredentialId: string)
getAllAvailableCredentials()
```

### Jobs
```typescript
getActiveJobs(limit = 20)
getRecruiterJobs(recruiterId: string)
getJobApplications(jobId: string)
getStudentApplications(studentId: string)
```

### Courses
```typescript
getCoursesByUniversity(universityId: string)
getCoursesByFaculty(facultyId: string)
getStudentCourses(studentId: string)
```

### Projects
```typescript
getStudentProjects(studentId: string)
getPublicProjects(limit = 20)
```

### Academic Records
```typescript
getAcademicRecords(studentId: string)
getStudentTranscript(studentId: string)
```

### Skills
```typescript
getUserSkills(userId: string)
getCommonSkills()
```

### Notifications
```typescript
getUserNotifications(userId: string, unreadOnly = false)
getUnreadNotificationCount(userId: string)
```

### Search
```typescript
searchStudents(searchTerm?: string, filters?: any)
```

## Missing Columns Added

### jobs table
- `company_name` TEXT
- `required_skills` TEXT[]
- `salary_range` TEXT
- `department` TEXT
- `application_deadline` DATE
- `remote_allowed` BOOLEAN
- `benefits` TEXT[]
- `required_Credentials` TEXT[]

### students table
- `phone` TEXT
- `location` TEXT
- `resume_hash` TEXT
- `date_of_birth` DATE
- `enrollment_status` TEXT
- `cgpa` DECIMAL(3,2)

### Credentials table
- `skills` TEXT[]
- `issuer` TEXT
- `requirements` TEXT[]
- `validity_period` INTEGER
- `Credential_level` TEXT

### user_credentials table
- `issuer_signature` TEXT
- `expiry_date` DATE
- `verification_url` TEXT

### profiles table
- `timezone` TEXT
- `locale` TEXT
- `last_login` TIMESTAMPTZ
- `is_verified` BOOLEAN
- `status` TEXT

## Verification Checklist

After running all SQL files, verify:

- [ ] All tables exist: Run `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
- [ ] RLS is enabled: Check `ALTER TABLE` statements executed successfully
- [ ] Triggers are active: Verify `updated_at` columns update automatically
- [ ] Views are created: Check `common_skills` and `available_Credentials` views
- [ ] Indexes exist: Query should be fast for common operations
- [ ] Foreign keys work: Test cascading deletes

## Common Issues & Solutions

### Issue: Trigger functions not found
**Solution**: Run `database-schema.sql` first to create the `update_updated_at_column()` function

### Issue: Column already exists errors
**Solution**: The `ADD COLUMN IF NOT EXISTS` should prevent this. If it occurs, the column was already added.

### Issue: RLS blocking queries
**Solution**: Check policy definitions. Policies allow:
- Public read for most data
- Users can update their own data
- Role-specific create permissions

### Issue: Views not updating
**Solution**: For materialized views, run `SELECT refresh_common_skills();`

## Testing Database

After setup, test with these queries:

```sql
-- Check user count by type
SELECT user_type, COUNT(*) FROM profiles GROUP BY user_type;

-- Check Credential statistics
SELECT COUNT(*) as total_Credentials, 
       SUM(CASE WHEN verified THEN 1 ELSE 0 END) as verified_Credentials
FROM user_credentials;

-- Check active jobs
SELECT COUNT(*) FROM jobs WHERE status = 'active';

-- Check course enrollments
SELECT COUNT(*) FROM course_enrollments WHERE status = 'active';

-- Check skills distribution
SELECT skill_category, COUNT(*) FROM user_skills GROUP BY skill_category;
```

## Next Steps

1. Run `database-schema.sql` in Supabase SQL Editor
2. Run `database-additional-tables.sql`
3. Run `database-schema-updates.sql`
4. Verify all tables and functions exist
5. Test with sample data
6. Update environment variables if needed
7. Deploy application

## Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify your Supabase project has sufficient permissions
3. Ensure PostgreSQL version is 14+ (required for some features)
4. Check RLS policies aren't blocking legitimate queries


