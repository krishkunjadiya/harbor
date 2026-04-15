# Dr. Jeffrey Turner - Expected Data Reference

## ðŸ“Š What SHOULD Be Showing in the Application

### Login Credentials
- **Email:** `dr.jeffrey.turner@harbor.edu`
- **Name:** Dr. Jeffrey Turner

---

## ðŸŽ¯ Faculty Dashboard - Expected Display

### Top Stats Cards (Expected Values)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Active Courses    Total Students   Credentials Issued   Pending â”‚
â”‚        3                 63              0            varies â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Course Details (Expected)

#### Course 1: SE301 - Software Engineering
- **Code:** SE301
- **Name:** Software Engineering
- **Description:** Software development lifecycle
- **Semester:** Fall 2024
- **Students:** 72 / 75 (96% full)
- **Credits:** 3
- **Status:** Active

#### Course 2 & 3: (Other Courses)
Based on CSV data, Dr. Turner should have **3 total courses** teaching **63 total students**.

---

## ðŸ”‘ Database IDs (for Reference)

### Profile & Auth
- **Auth User ID (profile_id):** `b1a1d1e1-1045-4000-8000-000000000145`
- **Email:** `dr.jeffrey.turner@harbor.edu`
- **Role:** `faculty`
- **User Type:** `university` âš ï¸ (must be 'university', NOT 'faculty')

### Faculty Record
- **Faculty UUID (id):** `0b506c4f-d819-44c4-af44-42cd667b3192`
- **Faculty ID (CSV):** `fac-0045`
- **Profile ID Link:** `b1a1d1e1-1045-4000-8000-000000000145`
- **Position:** Assistant Professor
- **Specialization:** Teaching Excellence
- **Join Date:** 2026-01-12
- **Status:** active

### Course Assignment
- **SE301 Course ID:** `9465752d-9c7b-461f-8805-36bbe7b325c5`
- **Course Instructor ID:** `0b506c4f-d819-44c4-af44-42cd667b3192` (Dr. Turner's faculty.id)
- **Department ID:** `fa0bc56b-94f0-411e-8924-18c1ce6dcb57`

---

## âœ… System Requirements Checklist

For the dashboard to work correctly:

### Database Requirements
- [ ] Profile exists with `id = b1a1d1e1-1045-4000-8000-000000000145`
- [ ] Profile has `user_type = 'university'` (NOT 'faculty')
- [ ] Profile has `role = 'faculty'`
- [ ] Faculty record exists with `id = 0b506c4f-d819-44c4-af44-42cd667b3192`
- [ ] Faculty `profile_id = b1a1d1e1-1045-4000-8000-000000000145`
- [ ] Course SE301 has `instructor_id = 0b506c4f-d819-44c4-af44-42cd667b3192`

### RLS Policy Requirements
- [ ] `get_current_faculty_id()` function exists
- [ ] `is_user_admin()` function exists
- [ ] Courses table has non-recursive SELECT policy
- [ ] Faculty table has SELECT policy for own record
- [ ] No infinite recursion in policies

### Application Flow
```
1. User logs in â†’ auth.uid() = b1a1d1e1-1045-4000-8000-000000000145
2. getFacultyDashboard(user.id) called
3. Query: SELECT * FROM faculty WHERE profile_id = auth.uid()
4. Returns: faculty.id = 0b506c4f-d819-44c4-af44-42cd667b3192
5. Query: SELECT * FROM courses WHERE instructor_id = faculty.id
6. Returns: SE301 + 2 more courses
7. Display: 3 courses, 63 students (or actual enrolled count)
```

---

## ðŸ› Common Issues & What You'll See

### Issue 1: No Courses Showing
**Symptoms:**
- Active Courses: 0
- Total Students: 0
- No course cards displayed
- Console error: "infinite recursion detected in policy for relation courses"

**Cause:** RLS policies creating circular dependency

**Fix:** Run `sql/comprehensive-csv-policy-fix.sql`

---

### Issue 2: Wrong Course Count
**Symptoms:**
- Shows wrong number of courses (not 3)
- Shows wrong student count (not 63)

**Cause:** 
- Profile ID mismatch in faculty table
- Orphaned course records

**Fix:** Run `sql/fix-faculty-data-complete.sql` then `sql/comprehensive-csv-policy-fix.sql`

---

### Issue 3: Profile Not Loading
**Symptoms:**
- Name shows as "Faculty Member" instead of "Dr. Jeffrey Turner"
- Dashboard loads but no data

**Cause:** `user_type` is NULL or wrong value

**Fix:** 
```sql
UPDATE public.profiles
SET user_type = 'university', role = 'faculty'
WHERE email = 'dr.jeffrey.turner@harbor.edu';
```

---

## ðŸ“ Diagnostic Script

Run this in Supabase SQL Editor while logged in as Dr. Turner:
```
sql/check-dr-turner-data.sql
```

This will show:
- âœ… What data exists in database
- âœ… What data RLS allows you to see
- âœ… What your dashboard query returns
- âœ… Comparison between expected vs actual
- âœ… Specific issues and fixes

---

## ðŸŽ¯ Success Criteria

When everything is working, you should see:

### Faculty Dashboard
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Faculty Dashboard                                    â”‚
â”‚ Welcome back, Dr. Jeffrey Turner                     â”‚
â”‚                                                      â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”       â”‚
â”‚ â”‚   3    â”‚ â”‚  63    â”‚ â”‚   0    â”‚ â”‚   ?    â”‚       â”‚
â”‚ â”‚ Active â”‚ â”‚ Total  â”‚ â”‚ Credentials â”‚ â”‚Pending â”‚       â”‚
â”‚ â”‚Courses â”‚ â”‚Studentsâ”‚ â”‚ Issued â”‚ â”‚Reviews â”‚       â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â”‚                                                      â”‚
â”‚ My Courses:                                          â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚ â”‚ SE301                        72 students   â”‚      â”‚
â”‚ â”‚ Software Engineering                       â”‚      â”‚
â”‚ â”‚ Schedule TBA                               â”‚      â”‚
â”‚ â”‚ [Progress bar]                             â”‚      â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚ â”‚ [Course 2]                                 â”‚      â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚ â”‚ [Course 3]                                 â”‚      â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Console (No Errors)
```
[getFacultyDashboard] Looking for faculty with profile_id: b1a1d1e1-1045-4000-8000-000000000145
[getFacultyDashboard] Found faculty profile: 0b506c4f-d819-44c4-af44-42cd667b3192 Dr. Jeffrey Turner
[getFacultyDashboard] Found courses: 3
```

---

## ðŸ“ž Reporting What You See

Please provide:

1. **Dashboard Stats:**
   - Active Courses: ___
   - Total Students: ___
   - Credentials Issued: ___
   - Pending Reviews: ___

2. **Course Display:**
   - [ ] No courses showing
   - [ ] Courses showing (list codes: ___)

3. **Console Errors:**
   - [ ] No errors
   - [ ] Infinite recursion error
   - [ ] Other errors: ___

4. **Diagnostic Results:**
   - Run `sql/check-dr-turner-data.sql` and share the output

---

## ðŸš€ Quick Fix Steps

If you're seeing ZERO courses:

1. **Stop the dev server** (Ctrl+C)
2. **Run in Supabase SQL Editor:**
   ```
   sql/comprehensive-csv-policy-fix.sql
   ```
3. **Wait for success message**
4. **Restart dev server:** `npm run dev` or `pnpm dev`
5. **Clear browser cache** or open incognito
6. **Login again** as dr.jeffrey.turner@harbor.edu
7. **Check dashboard**

Expected result: âœ… Shows 3 courses, 63 students

---

**Last Updated:** February 8, 2026  
**Status:** Diagnostic tools ready

