-- Update user_type in profiles table based on role column
-- This fixes the issue where all users had user_type='student'

-- Update students (already correct, but let's be explicit)
UPDATE public.profiles
SET user_type = 'student'
WHERE role = 'student';

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
  COUNT(*) as count,
  array_agg(DISTINCT role) as roles
FROM public.profiles
GROUP BY user_type
ORDER BY user_type;

-- Show some sample records for verification
SELECT id, email, role, user_type
FROM public.profiles
WHERE user_type = 'recruiter'
LIMIT 3;

SELECT id, email, role, user_type
FROM public.profiles
WHERE user_type = 'university'
LIMIT 3;
