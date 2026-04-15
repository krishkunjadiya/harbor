# Database Fix Instructions

## Problem Found
All users in the profiles table had `user_type='student'` regardless of their actual role. This caused:
- Wrong credentials not being caught (everyone was "student")
- Recruiters being able to log into student dashboard
- University admins being able to log into student dashboard

## Solution
1. Fixed the CSV file (✅ DONE)
2. Need to update the database

## Run This SQL in Supabase

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Update user_type in profiles table based on role column

-- Update recruiters
UPDATE public.profiles
SET user_type = 'recruiter'
WHERE role = 'recruiter';

-- Update faculty and admin_staff to university
UPDATE public.profiles
SET user_type = 'university'
WHERE role IN ('faculty', 'admin_staff', 'university_admin');

-- Update admins
UPDATE public.profiles
SET user_type = 'admin'
WHERE role = 'admin';

-- Verify the updates
SELECT 
  user_type, 
  COUNT(*) as count
FROM public.profiles
GROUP BY user_type
ORDER BY user_type;
```

## Expected Result
You should see:
- admin: 2
- recruiter: 50
- student: 50
- university: 55

## After Running SQL
1. **Refresh your browser** (Ctrl+F5)
2. **Try logging in again**:
   - Student email in student tab ✅ should work
   - Recruiter email in student tab ❌ should show error
   - Recruiter email in recruiter tab ✅ should work
   - Wrong password ❌ should stay on login page with error

## Test Credentials

**Student:**
- Email: sophia.martin@harbor.edu
- Password: Harbor@2024
- Tab: Student

**Recruiter:**
- Email: recruiter.smith@techcorp.com
- Password: Harbor@2024
- Tab: Recruiter

**University:**
- Email: uniadmin@ppsu.edu
- Password: Harbor@2024
- Tab: University
