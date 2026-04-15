# ðŸš€ COMPLETE IMPORT GUIDE - Harbor Student Management System

## âš ï¸ CRITICAL: Auth.Users Foreign Key Issue

The `profiles` table has a foreign key constraint that references `auth.users(id)`. This prevents direct CSV import.

---

## ðŸ“‹ STEP-BY-STEP IMPORT PROCESS

### **STEP 1: Drop the Auth Constraint**

Run this SQL in Supabase SQL Editor:

```sql
-- Drop the foreign key constraint temporarily
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;
```

**Or use the file:** `drop-auth-constraint.sql`

---

### **STEP 2: Import CSV Files in This Exact Order**

âš ï¸ **ORDER MATTERS!** Import in this sequence:

| # | File | Rows | Notes |
|---|------|------|-------|
| 1 | **profiles.csv** | 157 | âš¡ MUST BE FIRST |
| 2 | departments.csv | 4 | Required by faculty, courses |
| 3 | Credentials.csv | 50 | Required by user_credentials |
| 4 | universities.csv | 2 | References profiles.id |
| 5 | students.csv | 50 | References profiles.id |
| 6 | recruiters.csv | 50 | References profiles.id |
| 7 | faculty.csv | 50 | References profiles.id, departments.id |
| 8 | admin_staff.csv | 3 | References profiles.id |
| 9 | courses.csv | 50 | References departments.id, faculty.id |
| 10 | user_credentials.csv | 50 | References profiles.id, Credentials.id |
| 11 | credentials.csv | 50 | References profiles.id |
| 12 | jobs.csv | 50 | References profiles.id (recruiter) |
| 13 | job_applications.csv | 50 | References jobs.id, profiles.id |
| 14 | user_activity.csv | 50 | References profiles.id |
| 15 | dashboard_stats.csv | 50 | References profiles.id |
| 16 | notifications.csv | 50 | References profiles.id |
| 17 | student_projects.csv | 50 | References profiles.id, courses.id |
| 18 | academic_records.csv | 50 | References profiles.id, courses.id |
| 19 | student_full_records.csv | 50 | References profiles.id |
| 20 | user_skills.csv | 50 | References profiles.id |
| 21 | career_insights.csv | 50 | References profiles.id |

**Total: 1,016 rows**

---

### **STEP 3: Verify Import**

Run this SQL to check row counts:

```sql
SELECT 
  'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL SELECT 'students', COUNT(*) FROM public.students
UNION ALL SELECT 'universities', COUNT(*) FROM public.universities
UNION ALL SELECT 'recruiters', COUNT(*) FROM public.recruiters
UNION ALL SELECT 'faculty', COUNT(*) FROM public.faculty
UNION ALL SELECT 'admin_staff', COUNT(*) FROM public.admin_staff
UNION ALL SELECT 'departments', COUNT(*) FROM public.departments
UNION ALL SELECT 'courses', COUNT(*) FROM public.courses
UNION ALL SELECT 'Credentials', COUNT(*) FROM public.Credentials
UNION ALL SELECT 'user_credentials', COUNT(*) FROM public.user_credentials
UNION ALL SELECT 'credentials', COUNT(*) FROM public.credentials
UNION ALL SELECT 'jobs', COUNT(*) FROM public.jobs
UNION ALL SELECT 'job_applications', COUNT(*) FROM public.job_applications
UNION ALL SELECT 'user_activity', COUNT(*) FROM public.user_activity
UNION ALL SELECT 'dashboard_stats', COUNT(*) FROM public.dashboard_stats
UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL SELECT 'student_projects', COUNT(*) FROM public.student_projects
UNION ALL SELECT 'academic_records', COUNT(*) FROM public.academic_records
UNION ALL SELECT 'student_full_records', COUNT(*) FROM public.student_full_records
UNION ALL SELECT 'user_skills', COUNT(*) FROM public.user_skills
UNION ALL SELECT 'career_insights', COUNT(*) FROM public.career_insights
ORDER BY table_name;
```

**Expected Results:**
- profiles: 157
- students: 50
- universities: 2
- recruiters: 50
- And so on...

---

### **STEP 4: (Optional) Restore Auth Constraint**

âš ï¸ **Only do this if you plan to integrate with Supabase Auth**

**Option A: Don't restore (for development/testing)**
- Just leave it as is - data will work fine without the constraint

**Option B: Create matching auth.users records**
- Run: `restore-auth-constraint.sql`
- This creates dummy auth.users for each profile

**Option C: Restore constraint (will fail if no auth.users)**
```sql
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) 
  ON DELETE CASCADE;
```

---

## ðŸŽ¯ Quick Import Checklist

- [ ] 1. Run `drop-auth-constraint.sql` in Supabase
- [ ] 2. Import profiles.csv (157 rows)
- [ ] 3. Import departments.csv (4 rows)
- [ ] 4. Import Credentials.csv (50 rows)
- [ ] 5. Import universities.csv (2 rows)
- [ ] 6. Import students.csv (50 rows)
- [ ] 7. Import recruiters.csv (50 rows)
- [ ] 8. Import faculty.csv (50 rows)
- [ ] 9. Import admin_staff.csv (3 rows)
- [ ] 10. Import courses.csv (50 rows)
- [ ] 11. Import user_credentials.csv (50 rows)
- [ ] 12. Import credentials.csv (50 rows)
- [ ] 13. Import jobs.csv (50 rows)
- [ ] 14. Import job_applications.csv (50 rows)
- [ ] 15. Import user_activity.csv (50 rows)
- [ ] 16. Import dashboard_stats.csv (50 rows)
- [ ] 17. Import notifications.csv (50 rows)
- [ ] 18. Import student_projects.csv (50 rows)
- [ ] 19. Import academic_records.csv (50 rows)
- [ ] 20. Import student_full_records.csv (50 rows)
- [ ] 21. Import user_skills.csv (50 rows)
- [ ] 22. Import career_insights.csv (50 rows)
- [ ] 23. Verify row counts (should be 1,016 total)
- [ ] 24. (Optional) Run `restore-auth-constraint.sql`

---

## ðŸ”§ Troubleshooting

### Error: "violates foreign key constraint profiles_id_fkey"
**Solution:** Run `drop-auth-constraint.sql` first

### Error: "violates foreign key constraint universities_id_fkey"
**Solution:** Import profiles.csv before universities.csv

### Error: "violates foreign key constraint students_id_fkey"
**Solution:** Import profiles.csv before students.csv

### Error: Missing department/Credential references
**Solution:** Import departments.csv and Credentials.csv early in the sequence

---

## âœ… Success Indicators

After successful import you should have:
- âœ… 157 profiles (students, faculty, recruiters, admins, university admins)
- âœ… 50 students with complete academic data
- âœ… 50 recruiters with company information
- âœ… 50 faculty members
- âœ… 50 jobs posted
- âœ… 50 applications submitted
- âœ… All foreign key relationships valid

**Total: 1,016 rows of production-ready data!** ðŸš€

