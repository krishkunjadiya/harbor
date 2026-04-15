-- Comprehensive Faculty Profile Fix Script
-- Run this in Supabase SQL Editor to fix faculty profile data issues

-- STEP 1: Add missing columns to faculty table
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_hours TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_location TEXT;

-- STEP 2: Verify Dr. Turner's data exists
SELECT 
  id,
  profile_id,
  name,
  email, 
  position,
  specialization,
  total_courses,
  total_students,
  status
FROM public.faculty 
WHERE email = 'dr.jeffrey.turner@harbor.edu';

-- Expected result:
-- profile_id: b1a1d1e1-1045-4000-8000-000000000145
-- name: Dr. Jeffrey Turner
-- total_courses: 3
-- total_students: 63

-- STEP 3: Check if profile exists in profiles table
SELECT 
  id,
  email,
  user_type,
  role
FROM public.profiles
WHERE id = 'b1a1d1e1-1045-4000-8000-000000000145';

-- Expected:
-- user_type: university
-- role: faculty

-- STEP 4: Verify the profile_id matches in faculty table  
SELECT 
  f.id as faculty_id,
  f.profile_id,
  f.name,
  f.email,
  p.id as profile_exists,
  p.email as profile_email,
  p.role
FROM public.faculty f
LEFT JOIN public.profiles p ON f.profile_id = p.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- STEP 5: Check what courses Dr. Turner teaches
SELECT 
  c.id,
  c.code,
  c.name,
  c.instructor_id
FROM public.courses c
WHERE c.instructor_id = '0b506c4f-d819-44c4-af44-42cd667b3192';

-- Should return 3 courses

-- STEP 6: If you're logged in as Dr. Turner but seeing wrong data, check your auth user
-- Run this to see what user you're actually logged in as:
SELECT auth.uid() as current_user_id;

-- This should return: b1a1d1e1-1045-4000-8000-000000000145
-- If it returns something different, you're logged in as a different user

-- STEP 7: Check if there are duplicate faculty records
SELECT 
  profile_id,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names,
  STRING_AGG(email, ', ') as emails
FROM public.faculty
GROUP BY profile_id
HAVING COUNT(*) > 1;

-- Should return no results (no duplicates)

-- OPTIONAL: Update Dr. Turner's profile with sample data for testing
UPDATE public.faculty
SET 
  bio = 'Dr. Jeffrey Turner is an Assistant Professor specializing in Teaching Excellence. He brings innovative teaching methodologies and a passion for student success to the university.',
  office_hours = 'Monday-Wednesday: 2:00 PM - 4:00 PM, Thursday: 10:00 AM - 12:00 PM',
  office_location = 'Engineering Building, Room 305'
WHERE email = 'dr.jeffrey.turner@harbor.edu';
