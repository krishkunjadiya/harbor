-- Test Faculty Data and Relationships
-- Run this in Supabase SQL Editor to verify data exists and RLS is working

-- 1. Check if Dr. Jeffrey Turner profile exists
SELECT 'Profile Check' as test, *
FROM public.profiles
WHERE email = 'dr.jeffrey.turner@harbor.edu';

-- 2. Check if faculty record exists for Dr. Jeffrey Turner
SELECT 'Faculty Check' as test, *
FROM public.faculty
WHERE email = 'dr.jeffrey.turner@harbor.edu'
   OR name = 'Dr. Jeffrey Turner';

-- 3. Check the profile_id to faculty.id mapping
SELECT 'Profile-Faculty Mapping' as test,
       p.id as profile_id,
       p.email,
       f.id as faculty_id,
       f.name as faculty_name
FROM public.profiles p
LEFT JOIN public.faculty f ON f.profile_id = p.id
WHERE p.email = 'dr.jeffrey.turner@harbor.edu';

-- 4. Check courses for Dr. Jeffrey Turner (using faculty.id)
SELECT 'Courses Check' as test,
       c.code,
       c.name,
       c.instructor_id,
       f.name as instructor_name
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- 5. Count total courses per faculty
SELECT 'All Faculty Course Counts' as test,
       f.name,
       f.email,
       COUNT(c.id) as total_courses
FROM public.faculty f
LEFT JOIN public.courses c ON c.instructor_id = f.id
GROUP BY f.id, f.name, f.email
ORDER BY total_courses DESC
LIMIT 10;

-- 6. Check RLS policies on critical tables
SELECT 'RLS Status' as test,
       schemaname,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments', 'academic_records')
ORDER BY tablename;

-- 7. List all policies
SELECT 'Active Policies' as test,
       tablename,
       policyname,
       permissive,
       cmd as command,
       qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('faculty', 'courses', 'course_enrollments', 'assignments')
ORDER BY tablename, policyname;

-- 8. Test the exact query that the app uses
-- Replace 'YOUR_AUTH_UUID' with the actual auth.uid() when logged in
-- For testing, use the profile_id from profiles table
-- Example: b1a1d1e1-1045-4000-8000-000000000145 for Dr. Jeffrey Turner

-- Simulate getting faculty profile
SELECT 'Simulated App Query - Step 1' as test, *
FROM public.faculty
WHERE profile_id = 'b1a1d1e1-1045-4000-8000-000000000145';

-- Simulate getting courses (using the faculty.id from above)
-- Replace FACULTY_ID with the id from the query above
SELECT 'Simulated App Query - Step 2' as test, *
FROM public.courses
WHERE instructor_id = '0b506c4f-d819-44c4-af44-42cd667b3192';
