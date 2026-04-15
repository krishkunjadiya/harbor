FACULTY DASHBOARD DATA TROUBLESHOOTING GUIDE
==============================================

PROBLEM: Faculty dashboard shows no data (0 courses, 0 students, etc.)

DATA STRUCTURE (Verified from CSV files):
------------------------------------------
1. profiles table:
   - id: b1a1d1e1-1045-4000-8000-000000000145 (auth user ID)
   - email: dr.jeffrey.turner@harbor.edu
   - user_type: 'faculty'

2. faculty table:
   - id: 0b506c4f-d819-44c4-af44-42cd667b3192 (faculty record ID)
   - profile_id: b1a1d1e1-1045-4000-8000-000000000145 (links to profiles)
   - name: Dr. Jeffrey Turner
   - email: dr.jeffrey.turner@harbor.edu

3. courses table:
   - instructor_id: 0b506c4f-d819-44c4-af44-42cd667b3192 (links to faculty.id, NOT profile_id)
   - code: SE301
   - name: Software Engineering

CORRECT QUERY FLOW:
------------------
auth.uid() = b1a1d1e1-1045-4000-8000-000000000145
    ↓
SELECT * FROM faculty WHERE profile_id = auth.uid()
    ↓
faculty.id = 0b506c4f-d819-44c4-af44-42cd667b3192
    ↓
SELECT * FROM courses WHERE instructor_id = faculty.id
    ↓
Returns Dr. Jeffrey Turner's courses

DIAGNOSIS STEPS:
----------------

STEP 1: Run test-faculty-data.sql
   - This verifies the data exists in the database
   - Check if Dr. Jeffrey Turner's records are present
   - Verify the profile_id → faculty.id → courses relationship

STEP 2: Run test-rls-current-user.sql while logged in as Dr. Jeffrey Turner
   - Shows what auth.uid() and auth.email() return
   - Tests if RLS is blocking the queries
   - Temporarily disables RLS to verify data is accessible

STEP 3: Check the results:

   If data shows with RLS DISABLED:
   ✓ Data is in database
   ✗ RLS policies are blocking access
   → Solution: Run fix-rls-policies.sql

   If data does NOT show even with RLS disabled:
   ✗ Data not imported correctly
   → Solution: Re-import CSV files in correct order (see COMPLETE_IMPORT_ORDER.py)

KNOWN ISSUES & FIXES:
--------------------

ISSUE 1: RLS Policies Reference Wrong Columns
   Problem: Old policies check for 'faculty_id' column which doesn't exist
   Solution: Run fix-rls-policies.sql to update all policies

ISSUE 2: Policies Use Wrong Join Logic
   Problem: Policies check auth.uid() = faculty_id directly
   Correct: Should check if auth.uid() IN (SELECT profile_id FROM faculty WHERE ...)
   Solution: Already fixed in fix-rls-policies.sql

ISSUE 3: Missing Faculty → Courses Join
   Problem: Policies don't properly join faculty.profile_id → faculty.id → courses.instructor_id
   Solution: Updated policies use subqueries with proper joins

FILES TO RUN IN ORDER:
---------------------
1. test-faculty-data.sql          - Verify data exists
2. test-rls-current-user.sql      - Test RLS blocking
3. fix-rls-policies.sql           - Fix the policies (if RLS is the issue)
4. test-rls-current-user.sql      - Verify fix worked

VERIFICATION QUERIES (Run in Supabase while logged in):
-------------------------------------------------------

-- Check your auth info
SELECT auth.uid(), auth.email();

-- Check your faculty record
SELECT * FROM faculty WHERE profile_id = auth.uid();

-- Check your courses (should work after RLS fix)
SELECT c.code, c.name, c.total_students
FROM courses c
JOIN faculty f ON c.instructor_id = f.id
WHERE f.profile_id = auth.uid();

CODE CHANGES MADE:
------------------
All faculty-related functions now use the correct two-step query:

1. getFacultyDashboard(facultyId)     ✓ Fixed
2. getCoursesByFaculty(facultyId)     ✓ Fixed
3. getAssignmentsByFaculty(facultyId) ✓ Fixed
4. getCourseEnrollmentsByFaculty()    ✓ Fixed
5. getAcademicRecordsByFaculty()      ✓ Fixed

All functions:
1. First query faculty table by profile_id
2. Then query related tables using faculty.id

NEXT STEPS:
-----------
1. Run test-rls-current-user.sql in Supabase SQL Editor
2. Note what auth.uid() returns
3. Check if disabling RLS shows data
4. If yes → Run fix-rls-policies.sql
5. Re-enable RLS and test again
6. Check faculty dashboard page
