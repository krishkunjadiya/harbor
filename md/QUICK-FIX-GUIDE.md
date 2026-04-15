# Quick Fix Guide - Faculty Dashboard Issue

## Problem
Faculty dashboard shows no courses due to RLS infinite recursion error.

## Root Cause
1. RLS policies creating circular dependencies
2. Missing `user_type='university'` for faculty profiles  
3. Misaligned `faculty.profile_id` with `auth.users.id`

## Immediate Fix (3 Steps)

### Step 1: Run Comprehensive Fix SQL
**File:** `sql/comprehensive-csv-policy-fix.sql`

**Where:** Supabase SQL Editor  
**Time:** ~30 seconds

This script will:
- ✓ Add missing columns
- ✓ Fix profile data
- ✓ Remove orphaned records
- ✓ Create non-recursive RLS policies
- ✓ Add helper functions

### Step 2: Verify Results
**Expected Output:**
```
✓ AUDIT AND FIX COMPLETE
```

**Verification Query:**
```sql
-- Test your faculty access
SELECT 
    public.get_current_faculty_id() as my_faculty_id,
    public.is_user_admin() as am_i_admin;

-- Check your courses (should see SE301)
SELECT code, name, total_students 
FROM public.courses 
LIMIT 5;
```

### Step 3: Test in Application
1. Login as: `dr.jeffrey.turner@harbor.edu`
2. Go to faculty dashboard
3. Should see:
   - ✓ Course: SE301 - Software Engineering
   - ✓ Students: 72/75
   - ✓ No console errors

## What Changed

### Before (Broken)
```sql
-- ❌ Caused infinite recursion
CREATE POLICY "courses_select_instructor"
USING (
    EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.id = courses.instructor_id 
        AND f.profile_id = auth.uid()
    )
);
```

### After (Fixed)
```sql
-- ✓ Uses SECURITY DEFINER function
CREATE POLICY "courses_select_instructor"
USING (
    instructor_id = public.get_current_faculty_id()
);
```

## Validation Checklist

- [ ] SQL script executed without errors
- [ ] Verification queries return data
- [ ] Faculty dashboard loads
- [ ] Courses display correctly  
- [ ] No console errors
- [ ] Student count shows correctly

## If You Still Have Issues

### Issue: "infinite recursion" error persists
**Solution:** 
```sql
-- Check if policies were created
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies  
WHERE schemaname = 'public'
GROUP BY tablename;

-- Should show multiple policies per table
```

### Issue: No courses showing
**Solution:**
```sql
-- Check if faculty record exists
SELECT id, profile_id, email, name
FROM public.faculty
WHERE email = 'dr.jeffrey.turner@harbor.edu';

-- Check the link
SELECT 
    f.id as faculty_id,
    f.profile_id,
    auth.uid() as current_user_id,
    CASE WHEN f.profile_id = auth.uid() THEN 'LINKED' ELSE 'NOT LINKED' END
FROM public.faculty f
WHERE f.email = 'dr.jeffrey.turner@harbor.edu';
```

### Issue: Profile mismatch
**Solution:**
```sql
-- Manually fix Dr. Turner's profile
UPDATE public.faculty
SET profile_id = (SELECT id FROM auth.users WHERE email = 'dr.jeffrey.turner@harbor.edu')
WHERE email = 'dr.jeffrey.turner@harbor.edu';

-- Ensure profile exists with correct user_type
UPDATE public.profiles
SET user_type = 'university', role = 'faculty'
WHERE email = 'dr.jeffrey.turner@harbor.edu';
```

## Files Reference

| File | Purpose |
|------|---------|
| `sql/comprehensive-csv-policy-fix.sql` | Main fix script (RUN THIS) |
| `sql/fix-rls-recursion-v2.sql` | Alternative RLS-only fix |
| `sql/fix-faculty-data-complete.sql` | Diagnostic script |
| `validate-csv-data.py` | CSV data validator |
| `md/CSV-POLICY-AUDIT-RESULTS.md` | Full audit report |

## Success Indicators

✓ Console shows: `[getFacultyDashboard] Found courses: 1` (or more)  
✓ Dashboard displays course cards  
✓ No RLS recursion errors  
✓ Query execution < 1 second  

## Timeline

- **Diagnosis:** ✓ Complete
- **Fix Creation:** ✓ Complete  
- **Testing:** ⏳ Pending
- **Deployment:** ⏳ Ready

---

**Next Action:** Run `sql/comprehensive-csv-policy-fix.sql` in Supabase SQL Editor

**Estimated Time:** 5 minutes total
