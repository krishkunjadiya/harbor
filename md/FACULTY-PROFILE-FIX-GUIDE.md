# Faculty Profile - Real Data Fix Guide

## Problem
The faculty profile page is showing wrong data instead of real data from the database.

## Root Causes Identified

### 1. Missing Database Columns
The `faculty` table schema was missing several columns that the profile page tries to display:
- `status` - Present in CSV but not in schema
- `bio` - Expected by UI but not in database
- `office_hours` - Expected by UI but not in database
- `office_location` - Expected by UI but not in database

### 2. Possible Data Mismatch
The profile might be showing wrong data due to:
- Incorrect `profile_id` linkage
- User logged in with wrong account
- Cached or stale data

## Solution Steps

### Step 1: Run Database Migration
Execute the following SQL in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Run the file: sql/fix-faculty-profile-data.sql
```

Or copy and run this SQL directly:
```sql
-- Add missing columns
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_hours TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_location TEXT;
```

### Step 2: Verify Dr. Turner's Data

Run this query to check the data:
```sql
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
```

**Expected Results:**
- profile_id: `b1a1d1e1-1045-4000-8000-000000000145`
- name: `Dr. Jeffrey Turner`
- email: `dr.jeffrey.turner@harbor.edu`
- position: `Assistant Professor`
- specialization: `Teaching Excellence`
- total_courses: `3`
- total_students: `63`
- status: `active`

### Step 3: Check Your Login

1. Open browser console (F12)
2. Look for these debug messages after logging in:
   ```
   [Faculty Profile] Loading profile for user ID: b1a1d1e1-1045-4000-8000-000000000145
   [Faculty Profile] User email: dr.jeffrey.turner@harbor.edu
   [getFacultyProfile] Querying for profile_id: b1a1d1e1-1045-4000-8000-000000000145
   [getFacultyProfile] Retrieved data: {...}
   ```

3. Verify the user ID matches Dr. Turner's profile_id
4. Check that the retrieved data shows the correct name and email

### Step 4: Check for Data Issues

Run the comprehensive diagnostic script:
```bash
# File: sql/fix-faculty-profile-data.sql
# This will check for:
# - Missing columns
# - Profile existence
# - Data linkage
# - Duplicate records
# - Course assignments
```

### Step 5: Add Sample Profile Data (Optional)

To populate the new fields with sample data:
```sql
UPDATE public.faculty
SET 
  bio = 'Dr. Jeffrey Turner is an Assistant Professor specializing in Teaching Excellence. He brings innovative teaching methodologies and a passion for student success to the university.',
  office_hours = 'Monday-Wednesday: 2:00 PM - 4:00 PM, Thursday: 10:00 AM - 12:00 PM',
  office_location = 'Engineering Building, Room 305'
WHERE email = 'dr.jeffrey.turner@harbor.edu';
```

## Common Issues & Solutions

### Issue: Still seeing wrong data after migration
**Solution:** 
1. Clear browser cache and cookies
2. Sign out and sign in again
3. Check browser console for the debug logs
4. Verify you're logged in with the correct email

### Issue: No profile found message
**Solution:**
1. Check that faculty record exists: `SELECT * FROM faculty WHERE email = 'dr.jeffrey.turner@harbor.edu'`
2. Verify profile_id matches: Should be `b1a1d1e1-1045-4000-8000-000000000145`
3. Check RLS policies are not blocking access

### Issue: Seeing another faculty member's data
**Solution:**
1. Check what user you're logged in as: `SELECT auth.uid()`
2. Verify the profile_id in the faculty table matches your auth.uid()
3. Look for duplicate records: Run Step 7 from the diagnostic script

## Changes Made

### Files Modified:
1. **app/(university)/[org]/faculty/profile/page.tsx**
   - Added console logging for debugging
   - Shows user ID and email being used for the query
   - Logs the profile data received from database

2. **lib/actions/database.ts**
   - Enhanced `getFacultyProfile()` with detailed logging
   - Shows the profile_id being queried
   - Logs the data retrieved from database

### Files Created:
1. **sql/add-missing-faculty-columns.sql**
   - Migration to add missing columns

2. **sql/fix-faculty-profile-data.sql**
   - Comprehensive diagnostic and fix script

## Testing the Fix

1. **Login as Dr. Turner:**
   - Email: `dr.jeffrey.turner@harbor.edu`
   - Password: (use your test password)

2. **Navigate to Faculty Profile:**
   - Go to: `/{org}/faculty/profile`

3. **Verify the Data Shown:**
   - Name: Dr. Jeffrey Turner
   - Email: dr.jeffrey.turner@harbor.edu
   - Position: Assistant Professor
   - Specialization: Teaching Excellence
   - Courses: 3
   - Students: 63
   - Status Credential: Active

4. **Check Console Logs:**
   - Open browser console (F12)
   - Verify the logs show the correct user ID and data

## Next Steps

After running the migration:
1. Test the profile page
2. If wrong data still appears, check the console logs
3. Run the diagnostic queries to identify which data is mismatched
4. Report back with console log output if issue persists

The debugging logs will help identify exactly where the mismatch is occurring.

