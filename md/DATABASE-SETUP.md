# Database Setup Guide

This guide will help you set up the Harbor database in Supabase.

## Prerequisites

- Supabase account created
- Project created in Supabase
- Environment variables set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 1: Deploy Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the schema

This will create:
- âœ… 11 database tables
- âœ… Row Level Security (RLS) policies
- âœ… Triggers for automatic profile creation
- âœ… Indexes for performance
- âœ… Sample Credential data

## Step 2: Verify Tables Created

1. Navigate to **Table Editor** in Supabase
2. You should see these tables:
   - `profiles`
   - `students`
   - `universities`
   - `recruiters`
   - `Credentials`
   - `user_credentials`
   - `credentials`
   - `jobs`
   - `job_applications`
   - `user_activity`
   - `dashboard_stats`
   - `notifications`

## Step 3: Enable Email Authentication

1. Navigate to **Authentication** â†’ **Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email templates if needed
4. Set **Site URL** to your production URL (or `http://localhost:3000` for development)
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Your production domain callback URL

## Step 4: Test the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/register`
3. Create a test student account
4. Verify in Supabase Table Editor:
   - Check `auth.users` table for the new user
   - Check `profiles` table for the auto-created profile
   - Check `students` table for the student record

## Step 5: Seed Additional Data (Optional)

To add sample data for testing:

```sql
-- Add more Credentials
INSERT INTO Credentials (name, description, category, criteria, issuer_id)
VALUES 
  ('JavaScript Master', 'Completed advanced JavaScript course', 'technical', 'Complete all JS modules', 'YOUR_UNIVERSITY_ID_HERE'),
  ('Team Player', 'Excellent collaboration skills', 'soft_skills', 'Positive peer reviews', 'YOUR_UNIVERSITY_ID_HERE');

-- Add sample jobs (replace with real recruiter ID)
INSERT INTO jobs (recruiter_id, title, company, description, job_type, experience_level, status)
VALUES
  ('YOUR_RECRUITER_ID', 'Frontend Developer', 'Tech Corp', 'Build amazing UIs', 'full-time', 'entry-level', 'active'),
  ('YOUR_RECRUITER_ID', 'React Developer', 'StartUp Inc', 'Work with modern stack', 'full-time', 'mid-level', 'active');
```

## Step 6: Configure RLS Policies (If Needed)

The schema includes default RLS policies. To modify:

1. Navigate to **Authentication** â†’ **Policies**
2. Select a table (e.g., `profiles`)
3. View or edit existing policies
4. Add custom policies if needed

### Default RLS Rules:
- **profiles**: Public read, own data update
- **students/universities/recruiters**: Own data only
- **Credentials**: Public read, issuer can create
- **user_credentials**: Public read, system can create
- **jobs**: Public read, recruiter can manage
- **applications**: Student and recruiter can view their own

## Step 7: Monitor Database

1. Navigate to **Database** â†’ **Database** in Supabase
2. Check disk usage and performance
3. Set up backups if needed
4. Monitor slow queries

## Troubleshooting

### Tables Not Created
- Check SQL Editor for error messages
- Ensure you're running the full schema file
- Verify you have necessary permissions

### RLS Policies Blocking Access
- Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Check policy definitions match your use case
- Verify user metadata contains correct `user_type`

### Trigger Not Creating Profiles
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
- Check Supabase Auth logs for errors

### Foreign Key Errors
- Ensure parent records exist before creating child records
- Example: University must exist in `profiles` before creating Credentials

## Next Steps

After database setup:

1. âœ… Test user registration for all 3 user types
2. âœ… Verify automatic profile/student/university/recruiter record creation
3. âœ… Test dashboard data loading
4. âœ… Create sample Credentials, jobs, and credentials
5. âœ… Test application flow
6. âœ… Verify RLS policies are working correctly

## Database Schema Overview

```
auth.users (Supabase managed)
    â†“ (trigger creates)
profiles
    â”œâ”€â”€ students
    â”œâ”€â”€ universities
    â””â”€â”€ recruiters

Credentials (created by universities)
    â†“
user_credentials (students earn Credentials)

credentials (students add credentials)

jobs (created by recruiters)
    â†“
job_applications (students apply)

notifications (system notifications)
user_activity (activity tracking)
dashboard_stats (analytics)
```

## Useful SQL Commands

```sql
-- Count users by type
SELECT user_type, COUNT(*) 
FROM profiles 
GROUP BY user_type;

-- View all Credentials with issuer info
SELECT b.name, b.category, p.full_name as issuer 
FROM Credentials b 
JOIN profiles p ON b.issuer_id = p.id;

-- Check recent registrations
SELECT * FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- View application pipeline
SELECT 
  j.title, 
  j.company, 
  COUNT(*) as total_applications,
  SUM(CASE WHEN ja.status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN ja.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted
FROM jobs j
LEFT JOIN job_applications ja ON j.id = ja.job_id
GROUP BY j.id, j.title, j.company;
```

## Security Best Practices

1. **Never expose service role key** - Only use anon key in frontend
2. **Always use RLS** - Don't disable for production
3. **Validate user input** - Use constraints and triggers
4. **Audit sensitive operations** - Track who modified what
5. **Backup regularly** - Enable point-in-time recovery
6. **Monitor usage** - Set up alerts for unusual activity

## Support

- Supabase Docs: https://supabase.com/docs
- Database Schema: See `database-schema.sql`
- Type Definitions: See `lib/types/database.ts`

