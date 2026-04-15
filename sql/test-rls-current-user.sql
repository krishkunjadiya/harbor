-- Quick RLS Test - Run this in Supabase SQL Editor while logged in
-- This will show what the currently authenticated user can see

-- 1. Show current authenticated user
SELECT auth.uid() as current_user_id, auth.email() as current_user_email;

-- 2. Check if current user has faculty record
SELECT 'My Faculty Record' as test, *
FROM public.faculty
WHERE profile_id = auth.uid();

-- 3. Check courses visible to current user (with RLS enabled)
SELECT 'My Courses (with RLS)' as test,
       c.code,
       c.name,
       c.instructor_id
FROM public.courses c
WHERE c.instructor_id IN (
    SELECT id FROM public.faculty WHERE profile_id = auth.uid()
);

-- 4. TEMPORARY RLS BYPASS TEST (Run these one at a time)
-- ===========================================================
-- WARNING: These disable security temporarily for testing
-- ===========================================================

-- Step A: Disable RLS temporarily
ALTER TABLE public.faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;

-- Step B: After disabling, test queries again
SELECT 'Faculty (no RLS)' as test, COUNT(*) as total_faculty FROM public.faculty;
SELECT 'Courses (no RLS)' as test, COUNT(*) as total_courses FROM public.courses;

-- Check specific faculty courses
SELECT 'Dr Turner Courses (no RLS)' as test,
       c.code,
       c.name,
       f.name as instructor
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- Step C: RE-ENABLE RLS (IMPORTANT - Run this after testing!)
-- ===========================================================
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
