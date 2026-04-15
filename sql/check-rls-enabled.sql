-- ============================================================
-- CHECK: Is RLS Actually Enabled?
-- ============================================================

-- 1. Check if RLS is enabled on courses table
SELECT 
    'RLS Status' as check,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✓ RLS is ENABLED'
        ELSE '❌ RLS is DISABLED - THIS IS THE PROBLEM!'
    END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'courses';

-- 2. Check what policies exist NOW
SELECT 
    'Current Policies' as check,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'courses'
ORDER BY policyname;

-- 3. Check your profile and role
SELECT 
    'Your Profile' as check,
    p.email,
    p.role,
    p.user_type,
    CASE 
        WHEN p.role = 'admin' THEN '⚠️ You have ADMIN role - bypasses faculty restrictions'
        WHEN p.user_type = 'admin' THEN '⚠️ You have ADMIN user_type'
        ELSE '✓ Regular faculty'
    END as access_level
FROM public.profiles p
WHERE p.id = auth.uid();

-- 4. Check faculty linkage
SELECT 
    'Faculty Link' as check,
    auth.uid() as your_auth_id,
    f.id as your_faculty_id,
    f.email as faculty_email,
    f.profile_id as faculty_profile_id,
    CASE 
        WHEN f.profile_id = auth.uid() THEN '✓ LINKED'
        WHEN f.profile_id IS NULL THEN '❌ profile_id is NULL'
        ELSE '❌ profile_id MISMATCH'
    END as link_status
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';

-- 5. Test if you're bypassing RLS somehow
SELECT 
    'Bypass Check' as check,
    current_setting('is_superuser') as superuser,
    current_setting('session_authorization') as session_user,
    current_user as current_user,
    CASE 
        WHEN current_setting('is_superuser') = 'on' THEN '❌ Superuser - bypasses ALL RLS'
        ELSE '✓ Not superuser'
    END as status;
