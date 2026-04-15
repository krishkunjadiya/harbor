-- ============================================================
-- FIX: RLS Policy - Faculty Seeing All Courses Issue
-- ============================================================
-- Problem: Faculty members with user_type='university' are seeing
--          ALL courses because the admin policy matches them too
-- 
-- Solution: Change admin check from user_type to role-based

-- ============================================================
-- STEP 1: Drop the problematic admin policy
-- ============================================================

DROP POLICY IF EXISTS "courses_select_admin" ON public.courses;

-- ============================================================
-- STEP 2: Update the helper function to be more specific
-- ============================================================

-- This function should only return TRUE for actual admins, not faculty
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only return true for users with role='admin' 
    -- NOT for user_type='university' (faculty have this too)
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'  -- Changed from: role IN ('admin', 'university')
    );
END;
$$;

-- ============================================================
-- STEP 3: Create a new, more specific admin policy
-- ============================================================

CREATE POLICY "courses_select_admin"
ON public.courses
FOR SELECT
USING (
    -- Only true admins (role='admin'), NOT faculty
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role = 'admin'
    )
);

-- ============================================================
-- STEP 4: Ensure faculty policy exists and is correct
-- ============================================================

-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "courses_select_instructor" ON public.courses;

CREATE POLICY "courses_select_instructor"
ON public.courses
FOR SELECT
USING (
    -- Faculty can see their own courses
    instructor_id = public.get_current_faculty_id()
);

-- ============================================================
-- STEP 5: Verification
-- ============================================================

-- Check the updated function
SELECT 
    'Updated Admin Function' as check,
    public.is_user_admin() as am_i_admin,
    CASE 
        WHEN public.is_user_admin() THEN '❌ Still returns TRUE - check your role'
        ELSE '✓ Returns FALSE - correct for faculty'
    END as result;

-- Check how many courses you can see now
SELECT 
    'Courses Visible After Fix' as check,
    COUNT(*) as courses_you_see,
    CASE 
        WHEN COUNT(*) = 1 THEN '✓ FIXED - Seeing only your course'
        WHEN COUNT(*) > 1 THEN '❌ Still seeing multiple courses'
        ELSE '❌ Not seeing any courses'
    END as status
FROM public.courses;

-- Show which courses
SELECT 
    'Your Visible Courses' as check,
    c.code,
    c.name,
    c.total_students
FROM public.courses c
ORDER BY c.code;

-- Check your profile details
SELECT 
    'Your Profile Details' as check,
    p.email,
    p.role,
    p.user_type,
    CASE 
        WHEN p.role = 'admin' THEN '❌ You have admin role - will see all courses'
        WHEN p.role = 'faculty' THEN '✓ Faculty role - should see only yours'
        ELSE '⚠️ Unexpected role: ' || p.role
    END as role_status
FROM public.profiles p
WHERE p.id = auth.uid();

-- Final verification
DO $$
DECLARE
    v_courses_visible INT;
    v_is_admin BOOLEAN;
    v_role TEXT;
BEGIN
    SELECT COUNT(*) INTO v_courses_visible FROM public.courses;
    SELECT public.is_user_admin() INTO v_is_admin;
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FIX VERIFICATION';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Your Role: %', v_role;
    RAISE NOTICE 'Admin Function Returns: %', v_is_admin;
    RAISE NOTICE 'Courses Visible: %', v_courses_visible;
    RAISE NOTICE '';
    
    IF v_courses_visible = 1 AND NOT v_is_admin AND v_role = 'faculty' THEN
        RAISE NOTICE '✅ SUCCESS! RLS is now working correctly';
        RAISE NOTICE '   You see only your 1 assigned course';
    ELSIF v_courses_visible > 1 AND v_role = 'admin' THEN
        RAISE NOTICE '✓ You have admin role - seeing all courses is expected';
    ELSIF v_courses_visible > 1 AND v_role = 'faculty' THEN
        RAISE NOTICE '❌ STILL AN ISSUE - faculty seeing multiple courses';
        RAISE NOTICE '   Check if there are other permissive policies';
    ELSE
        RAISE NOTICE '⚠️ Unexpected state - manual review needed';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;
