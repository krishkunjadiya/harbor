-- ============================================================
-- FACULTY DATA FIX - Complete Diagnostic and Repair
-- ============================================================
-- Run this script in Supabase SQL Editor while logged in as Dr. Jeffrey Turner
-- This will diagnose and fix the faculty dashboard data issues

-- ============================================================
-- STEP 1: DIAGNOSTIC - Check Current State
-- ============================================================

-- 1.1 What is my current authenticated user ID?
SELECT 
    'Current User' as check_type,
    auth.uid() as my_auth_id,
    auth.email() as my_email;

-- 1.2 Do I have a profile record?
SELECT 
    'My Profile' as check_type,
    p.id,
    p.email,
    p.full_name,
    p.role
FROM public.profiles p
WHERE p.id = auth.uid();

-- 1.3 Do I have a faculty record linked to my profile?
SELECT 
    'My Faculty Record' as check_type,
    f.id as faculty_id,
    f.profile_id,
    f.name,
    f.email,
    f.department_id
FROM public.faculty f
WHERE f.profile_id = auth.uid();

-- 1.4 What courses should I see? (without RLS - checking raw data)
SELECT 
    'My Courses (checking raw data)' as check_type,
    c.id,
    c.code,
    c.name,
    c.instructor_id,
    f.name as instructor_name,
    f.profile_id
FROM public.courses c
JOIN public.faculty f ON c.instructor_id = f.id
WHERE f.profile_id = auth.uid();

-- 1.5 Check RLS policies blocking access
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd,
    qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('faculty', 'courses')
ORDER BY tablename, policyname;

-- ============================================================
-- STEP 2: PROFILE_ID VERIFICATION AND FIX
-- ============================================================

-- Check if there's a mismatch between auth users and profiles
SELECT 
    'Profile-Auth Mismatch Check' as check_type,
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    CASE 
        WHEN au.id = p.id THEN 'MATCH ✓'
        ELSE 'MISMATCH ✗'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.email = p.email
WHERE au.email = 'dr.jeffrey.turner@harbor.edu';

-- ============================================================
-- STEP 3: FIX PROFILE_ID MISMATCHES
-- ============================================================

-- Update faculty.profile_id to match auth.users.id
DO $$
DECLARE
    v_auth_id uuid;
    v_faculty_id uuid;
BEGIN
    -- Get the auth user ID for Dr. Jeffrey Turner
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE email = 'dr.jeffrey.turner@harbor.edu';

    IF v_auth_id IS NULL THEN
        RAISE NOTICE 'No auth user found for dr.jeffrey.turner@harbor.edu';
        RETURN;
    END IF;

    RAISE NOTICE 'Auth ID found: %', v_auth_id;

    -- Update faculty table to link to the correct auth user ID
    UPDATE public.faculty
    SET profile_id = v_auth_id
    WHERE email = 'dr.jeffrey.turner@harbor.edu'
    RETURNING id INTO v_faculty_id;

    RAISE NOTICE 'Updated faculty record. Faculty ID: %', v_faculty_id;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, email, full_name, role, user_type)
    VALUES (v_auth_id, 'dr.jeffrey.turner@harbor.edu', 'Dr. Jeffrey Turner', 'faculty', 'university')
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
        role = 'faculty',
        user_type = 'university',
        email = EXCLUDED.email;

    RAISE NOTICE 'Profile ensured for auth ID: %', v_auth_id;
END $$;

-- ============================================================
-- STEP 4: FIX RLS POLICIES
-- ============================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Faculty can view own profile" ON public.faculty;
DROP POLICY IF EXISTS "Faculty can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view their courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty read own data" ON public.faculty;

-- Create correct RLS policies for faculty table
CREATE POLICY "Faculty members can view their own record"
ON public.faculty
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all faculty"
ON public.faculty
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'university')
    )
);

-- Create correct RLS policies for courses table
CREATE POLICY "Faculty can view their own courses"
ON public.courses
FOR SELECT
USING (
    instructor_id IN (
        SELECT id FROM public.faculty
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Students can view enrolled courses"
ON public.courses
FOR SELECT
USING (
    id IN (
        SELECT course_id FROM public.course_enrollments
        WHERE student_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all courses"
ON public.courses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'university')
    )
);

-- ============================================================
-- STEP 5: VERIFICATION - Test After Fixes
-- ============================================================

-- 5.1 Verify my faculty record is now correct
SELECT 
    'AFTER FIX: My Faculty Record' as check_type,
    f.id as faculty_id,
    f.profile_id,
    f.name,
    f.email,
    CASE 
        WHEN f.profile_id = auth.uid() THEN 'LINKED ✓'
        ELSE 'NOT LINKED ✗'
    END as link_status
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- 5.2 Verify courses are now visible (with RLS enabled)
SELECT 
    'AFTER FIX: My Courses (with RLS)' as check_type,
    c.code,
    c.name,
    c.instructor_id,
    c.total_students,
    c.max_students
FROM public.courses c
WHERE c.instructor_id IN (
    SELECT id FROM public.faculty
    WHERE profile_id = auth.uid()
);

-- 5.3 Count verification
SELECT 
    'AFTER FIX: Summary' as check_type,
    COUNT(DISTINCT c.id) as total_courses,
    SUM(c.total_students) as total_students
FROM public.courses c
WHERE c.instructor_id IN (
    SELECT id FROM public.faculty
    WHERE profile_id = auth.uid()
);

-- ============================================================
-- STEP 6: BATCH FIX FOR ALL FACULTY (Optional)
-- ============================================================

-- Run this to fix ALL faculty members, not just Dr. Turner
-- UNCOMMENT the lines below to execute:


DO $$
DECLARE
    faculty_rec RECORD;
    v_auth_id uuid;
BEGIN
    FOR faculty_rec IN 
        SELECT DISTINCT f.id, f.email, f.name
        FROM public.faculty f
        WHERE f.email IS NOT NULL
    LOOP
        -- Find matching auth user by email
        SELECT au.id INTO v_auth_id
        FROM auth.users au
        WHERE au.email = faculty_rec.email;

        IF v_auth_id IS NOT NULL THEN
            -- Update faculty.profile_id
            UPDATE public.faculty
            SET profile_id = v_auth_id
            WHERE id = faculty_rec.id;

            -- Ensure profile exists
            INSERT INTO public.profiles (id, email, full_name, role, user_type)
            VALUES (v_auth_id, faculty_rec.email, faculty_rec.name, 'faculty', 'university')
            ON CONFLICT (id) DO UPDATE
            SET 
                full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
                role = 'faculty',
                user_type = 'university';

            RAISE NOTICE 'Fixed: % -> Auth ID: %', faculty_rec.email, v_auth_id;
        ELSE
            RAISE NOTICE 'No auth user found for: %', faculty_rec.email;
        END IF;
    END LOOP;
END $$;


-- ============================================================
-- FINAL VERIFICATION QUERY
-- ============================================================

SELECT 
    '✓ READY TO TEST' as status,
    'Log into the app as dr.jeffrey.turner@harbor.edu and check the faculty dashboard' as next_step;
