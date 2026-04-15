================================================================================
FACULTY DATA DISPLAY ISSUE - ROOT CAUSE ANALYSIS
================================================================================
Date: February 8, 2026
Author: Senior Full-Stack Developer & Database Debugger

================================================================================
EXECUTIVE SUMMARY
================================================================================

ROOT CAUSE:
The is_user_admin() helper function uses an incorrect condition that treats
faculty members as admins, causing them to see ALL courses instead of only
their assigned courses.

IMPACT:
- Faculty members can see all 50 courses in the database via RLS
- Dashboard correctly shows filtered data (1 course) due to application logic
- CRITICAL SECURITY ISSUE: Faculty have unauthorized database-level access

STATUS: 
✓ Root cause identified
✓ Fix created
⏳ Awaiting deployment

================================================================================
1. DATA FLOW ANALYSIS
================================================================================

CSV → Database → RLS Policies → Application → UI

[CSV FILES]
├── profiles.csv
│   └── Dr. Jeffrey Turner: id=b1a1d1e1-1045-4000-8000-000000000145
│       ├── role: 'faculty'
│       └── user_type: 'university'  ← IMPORTANT
│
├── faculty.csv  
│   └── Dr. Jeffrey Turner: id=0b506c4f-d819-44c4-af44-42cd667b3192
│       └── profile_id: b1a1d1e1-1045-4000-8000-000000000145 ✓ LINKED
│
└── courses.csv
    └── SE301: instructor_id=0b506c4f-d819-44c4-af44-42cd667b3192 ✓ LINKED

[DATABASE SCHEMA]
├── profiles table
│   ├── id UUID (PK)
│   ├── role TEXT ('admin', 'faculty', 'student', etc.)
│   └── user_type TEXT CHECK ('student', 'university', 'recruiter', 'admin')
│
├── faculty table
│   ├── id UUID (PK)
│   └── profile_id UUID → profiles(id) ✓ REFERENCES CORRECT
│
└── courses table
    ├── id UUID (PK)
    └── instructor_id UUID → faculty(id) ✓ REFERENCES CORRECT

[RLS POLICIES ON COURSES]
├── courses_select_instructor: WHERE instructor_id = get_current_faculty_id()
├── courses_select_enrolled: WHERE id IN (SELECT get_student_course_ids())
└── courses_select_admin: WHERE is_user_admin() = TRUE  ← BUG HERE

[APPLICATION LAYER]
└── getFacultyDashboard(user.id)
    ├── Step 1: SELECT * FROM faculty WHERE profile_id = user.id
    │   Result: ✓ Returns Dr. Turner's faculty record
    ├── Step 2: SELECT * FROM courses WHERE instructor_id = faculty.id
    │   Result: ✓ Returns 1 course (SE301)
    └── Dashboard displays: 1 Active Course ✓ CORRECT

[RLS LAYER - DIRECT QUERY]
└── SELECT COUNT(*) FROM courses;
    ├── Checks RLS policy: is_user_admin()
    ├── Function returns: TRUE (INCORRECT!)
    └── Result: 50 courses visible ❌ SECURITY BUG

================================================================================
2. CSV FILE VALIDATION
================================================================================

✓ PASSED: All CSV files structurally valid
✓ PASSED: Headers match database schema
✓ PASSED: No encoding issues (UTF-8)
✓ PASSED: Delimiter consistency (comma)
✓ PASSED: Dr. Turner's data exists in all 3 files

CSV CONTENT VERIFICATION:
┌─────────────┬────────────────────────────────────────────┐
│ File        │ Dr. Jeffrey Turner Details                 │
├─────────────┼────────────────────────────────────────────┤
│ profiles    │ id: b1a1d1e1-1045-4000-8000-000000000145   │
│             │ email: dr.jeffrey.turner@harbor.edu        │
│             │ role: 'faculty'                            │
│             │ user_type: 'university'                    │
├─────────────┼────────────────────────────────────────────┤
│ faculty     │ id: 0b506c4f-d819-44c4-af44-42cd667b3192   │
│             │ profile_id: (matches profiles.id) ✓        │
│             │ total_courses: 3 (METADATA ONLY)           │
│             │ total_students: 63 (METADATA ONLY)         │
├─────────────┼────────────────────────────────────────────┤
│ courses     │ SE301: instructor_id=(matches faculty.id)✓ │
│             │ Only 1 course assigned                     │
│             │ 72 students enrolled                       │
└─────────────┴────────────────────────────────────────────┘

⚠️ NOTE: faculty.total_courses=3 but only 1 course in courses.csv
         This is just cached metadata, not authoritative

================================================================================
3. DATABASE SCHEMA VALIDATION
================================================================================

✓ PASSED: All tables created correctly
✓ PASSED: Foreign key relationships intact
✓ PASSED: Column names match CSV headers
✓ PASSED: Data types compatible

SCHEMA ALIGNMENT:
┌──────────────┬─────────────────────┬──────────────────┐
│ Table        │ CSV Column          │ DB Column        │
├──────────────┼─────────────────────┼──────────────────┤
│ profiles     │ id                  │ id UUID          │
│              │ role                │ role TEXT        │
│              │ user_type           │ user_type TEXT   │
├──────────────┼─────────────────────┼──────────────────┤
│ faculty      │ id                  │ id UUID          │
│              │ profile_id          │ profile_id UUID  │
├──────────────┼─────────────────────┼──────────────────┤
│ courses      │ id                  │ id UUID          │
│              │ instructor_id       │ instructor_id    │
└──────────────┴─────────────────────┴──────────────────┘

✓ All references resolve correctly
✓ No orphaned records
✓ Cascade deletion configured

================================================================================
4. BACKEND CODE ANALYSIS
================================================================================

FILE: lib/actions/database.ts

FUNCTION: getFacultyDashboard(facultyId: string)
```typescript
// Step 1: Get faculty profile by profile_id
const { data: facultyProfile } = await supabase
  .from('faculty')
  .select('*')
  .eq('profile_id', facultyId)  // facultyId = auth.uid()
  .single()

// Step 2: Get courses by faculty.id (not profile_id!)
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .eq('instructor_id', facultyProfile.id)  // Uses faculty.id
```

✓ CORRECT: Uses profile_id to find faculty record
✓ CORRECT: Uses faculty.id (not profile_id) for courses
✓ CORRECT: Two-step query avoids RLS recursion

EXECUTION TRACE:
1. User logs in → auth.uid() = b1a1d1e1-1045-4000-8000-000000000145
2. getFacultyDashboard(b1a1d1e1-1045-4000-8000-000000000145)
3. Query faculty WHERE profile_id = b1a1d1e1-1045-4000-8000-000000000145
4. Returns facultyProfile.id = 0b506c4f-d819-44c4-af44-42cd667b3192
5. Query courses WHERE instructor_id = 0b506c4f-d819-44c4-af44-42cd667b3192
6. Returns 1 course: SE301
7. Dashboard shows: 1 Active Course ✓

================================================================================
5. FRONTEND CODE ANALYSIS
================================================================================

FILE: app/(university)/[org]/faculty/dashboard/page.tsx

```tsx
const { data: { user } } = await supabase.auth.getUser()
const dashboardData = await getFacultyDashboard(user.id)
```

✓ CORRECT: Calls getFacultyDashboard with auth.uid()
✓ CORRECT: Displays dashboardData.totalCourses
✓ CORRECT: Maps through dashboardData.courses array

RENDERED OUTPUT:
- Active Courses: 1 ✓
- Total Students: 72 ✓  
- Course Code: SE301 ✓
- Course Name: Software Engineering ✓

================================================================================
6. RLS POLICY ANALYSIS - THE BUG
================================================================================

HELPER FUNCTION: is_user_admin()
```sql
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (
            role IN ('admin', 'university')       ← ❌ CHECKING WRONG FIELD
            OR 
            user_type IN ('admin', 'university')  ← ❌ THIS MATCHES FACULTY!
        )
    );
END;
$$;
```

PROBLEM ANALYSIS:
┌──────────────────┬─────────────┬──────────────┬──────────────┐
│ User             │ role        │ user_type    │ is_admin()?  │
├──────────────────┼─────────────┼──────────────┼──────────────┤
│ True Admin       │ 'admin'     │ 'admin'      │ TRUE ✓       │
│ Dr. Turner       │ 'faculty'   │ 'university' │ TRUE ❌      │
│ Student          │ 'student'   │ 'student'    │ FALSE ✓      │
│ Recruiter        │ 'recruiter' │ 'recruiter'  │ FALSE ✓      │
└──────────────────┴─────────────┴──────────────┴──────────────┘

WHY THE BUG EXISTS:
- Schema has CHECK constraint: user_type IN ('student', 'university', 'recruiter', 'admin')
- Faculty members MUST use user_type='university' (no 'faculty' option in CHECK)
- Function checks: user_type IN ('admin', 'university')
- Result: Faculty members match 'university' → treated as admin!

RLS POLICY: courses_select_admin
```sql
CREATE POLICY "courses_select_admin" ON public.courses FOR SELECT
  USING (public.is_user_admin());
```

EXECUTION FLOW:
1. Dr. Turner queries: SELECT * FROM courses;
2. RLS checks all policies:
   - courses_select_instructor: instructor_id = get_current_faculty_id()
     → Returns NULL or 0b506c4f-d819-44c4-af44-42cd667b3192
     → Matches 1 course
   - courses_select_admin: is_user_admin()
     → Returns TRUE (BUG!)
     → Matches ALL 50 courses
3. RLS uses OR logic: Allow if ANY policy matches
4. Result: Faculty sees all 50 courses ❌

================================================================================
7. THE FIX
================================================================================

PRIMARY FIX: Update is_user_admin() function
```sql
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only check role, NOT user_type
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'  -- ✓ Only true admins
    );
END;
$$;
```

ALTERNATIVE FIX (if needed): Update RLS policy directly
```sql
DROP POLICY IF EXISTS "courses_select_admin" ON public.courses;

CREATE POLICY "courses_select_admin" ON public.courses FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role = 'admin' AND user_type = 'admin'  -- Both must match
    )
  );
```

================================================================================
8. VALIDATION STEPS
================================================================================

PRE-FIX STATE:
┌─────────────────────────────────┬──────────────┐
│ Test                            │ Result       │
├─────────────────────────────────┼──────────────┤
│ Dashboard shows courses         │ 1 ✓          │
│ is_user_admin() returns         │ TRUE ❌      │
│ SELECT COUNT(*) FROM courses    │ 50 ❌        │
│ Security: Faculty isolation     │ FAILED ❌    │
└─────────────────────────────────┴──────────────┘

POST-FIX EXPECTED STATE:
┌─────────────────────────────────┬──────────────┐
│ Test                            │ Expected     │
├─────────────────────────────────┼──────────────┤
│ Dashboard shows courses         │ 1 ✓          │
│ is_user_admin() returns         │ FALSE ✓      │
│ SELECT COUNT(*) FROM courses    │ 1 ✓          │
│ Security: Faculty isolation     │ PASSED ✓     │
└─────────────────────────────────┴──────────────┘

VALIDATION QUERIES:
```sql
-- Test 1: Check admin function
SELECT public.is_user_admin() as am_i_admin;
-- Expected: FALSE

-- Test 2: Count visible courses
SELECT COUNT(*) as courses_visible FROM public.courses;
-- Expected: 1

-- Test 3: List visible courses
SELECT code, name, instructor_id FROM public.courses;
-- Expected: Only SE301

-- Test 4: Verify profile
SELECT email, role, user_type FROM public.profiles WHERE id = auth.uid();
-- Expected: role='faculty', user_type='university'
```

================================================================================
9. EVIDENCE SUMMARY
================================================================================

CSV FILES:
✓ All data present and correctly linked
✓ No structural issues
⚠️ Metadata (total_courses) doesn't match reality (informational only)

DATABASE SCHEMA:
✓ Tables created correctly
✓ Foreign keys valid
✓ Constraints working
✓ RLS enabled

BACKEND CODE:
✓ getFacultyDashboard() logic correct
✓ Query structure avoids recursion
✓ Returns proper data

FRONTEND CODE:
✓ Dashboard component working
✓ Displays data correctly
✓ No client-side errors

RLS POLICIES:
❌ is_user_admin() function has logic bug
❌ Treats faculty as admins
❌ Causes security vulnerability

APPLICATION BEHAVIOR:
✓ Dashboard shows 1 course (application-filtered)
❌ Direct database access shows 50 courses (RLS failure)

================================================================================
10. PRIORITY ASSESSMENT
================================================================================

CRITICAL (P0) - SECURITY:
❌ Faculty members have admin-level database access
❌ Can see all courses via direct queries
❌ Potential data leak if API endpoints bypass app logic

HIGH (P1) - FUNCTIONALITY:
✓ Dashboard working (app logic compensates for RLS bug)
⚠️ Metadata mismatch (low impact)

MEDIUM (P2) - DATA QUALITY:
⚠️ faculty.total_courses shows 3, actual is 1
⚠️ Cached counters not updated

================================================================================
11. DEPLOYMENT CHECKLIST
================================================================================

PRE-DEPLOYMENT:
□ Backup current database state
□ Test fix in staging/development environment
□ Run validation queries before fix
□ Document current RLS policy state

DEPLOYMENT:
□ Run fix SQL script: sql/FINAL-FIX-RLS-ADMIN-FUNCTION.sql
□ Verify function updated: SELECT prosrc FROM pg_proc WHERE proname = 'is_user_admin'
□ Check courses_select_admin policy still exists
□ Restart any connection poolers if applicable

POST-DEPLOYMENT VERIFICATION:
□ Login as Dr. Jeffrey Turner
□ Run: SELECT public.is_user_admin(); → Expect FALSE
□ Run: SELECT COUNT(*) FROM courses; → Expect 1
□ Run: SELECT code FROM courses; → Expect only SE301
□ Check dashboard still shows 1 course
□ Check no errors in application logs

ROLLBACK PLAN (if needed):
□ Restore is_user_admin() to original version
□ Verify dashboard still functional
□ Escalate to senior DBA

================================================================================
12. FINAL SUMMARY
================================================================================

ROOT CAUSE:
The is_user_admin() RLS helper function incorrectly identifies faculty members
as administrators by checking user_type='university'. Since faculty members must
use user_type='university' (per CHECK constraint), they match the admin condition
and can see all courses at the database level.

IMPACT:
- SECURITY: Faculty have unauthorized access to all course records
- FUNCTIONALITY: Dashboard works correctly (app-level filtering compensates)
- DATA: CSV files and schema are correct; no data corruption

FIX:
Update is_user_admin() to check ONLY role='admin', not user_type.

PRIORITY:
CRITICAL - Must be deployed before production use

ESTIMATED FIX TIME:
- SQL execution: < 1 minute
- Testing: 5 minutes
- Total: < 10 minutes

FILES CREATED:
- sql/FINAL-FIX-RLS-ADMIN-FUNCTION.sql (deployment script)
- sql/verify-fix.sql (validation queries)

================================================================================
END OF ANALYSIS
================================================================================
