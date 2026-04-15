-- Quick check: How many courses does Dr. Turner actually have assigned?
-- Run this in Supabase SQL Editor

-- Option 1: Direct query (bypass RLS to see truth)
SELECT 
    'Dr. Turner Courses (Direct)' as check_type,
    c.code,
    c.name,
    c.total_students,
    c.instructor_id,
    f.name as instructor_name
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu'
ORDER BY c.code;

-- Option 2: Count his courses
SELECT 
    'Course Count' as check_type,
    COUNT(*) as actual_courses_in_db,
    f.total_courses as csv_says_should_be,
    CASE 
        WHEN COUNT(*) = f.total_courses THEN '✓ MATCH'
        ELSE '✗ MISMATCH - Some courses missing!'
    END as status
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.email = 'dr.jeffrey.turner@harbor.edu'
GROUP BY f.total_courses;

-- Option 3: Show what YOU can see via RLS
SELECT 
    'What You See (via RLS)' as check_type,
    COUNT(*) as courses_visible_to_you
FROM public.courses;
