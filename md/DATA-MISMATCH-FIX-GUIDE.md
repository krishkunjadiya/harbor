# Data Mismatch Fix Guide

## 📋 Overview

This guide helps you fix all **306 data mismatches** found in the database audit. The mismatches span across 8 categories affecting courses, faculty, universities, departments, students, jobs, and skills.

---

## 🚨 Critical Issues Summary

| Issue | Affected Records | Severity | Impact |
|-------|------------------|----------|---------|
| Course enrollments | 50 courses | CRITICAL | All courses show only 1 student instead of 38-98 |
| Faculty student counts | 50 faculty | CRITICAL | Faculty show 0-2 students instead of 50-294 |
| Faculty course counts | 50 faculty | HIGH | Faculty show 1-2 courses instead of 2-7 |
| University totals | 2 universities | CRITICAL | Off by 12,000+ students, 200+ faculty |
| Department totals | 4 departments | HIGH | All metrics incorrect |
| Student GPA sync | 48 students | MEDIUM | GPA differs by up to 1.19 points |
| Job application counts | 50 jobs | LOW | Count off by 1-20 applications |
| Skill endorsements | 42 skills | LOW | Count off by 1-4 endorsements |

---

## 📁 Files Created

### 1. **verify-data-mismatches.sql**
- Checks current state WITHOUT making changes
- Shows detailed mismatch reports
- Run this FIRST to see what will be fixed

### 2. **fix-all-data-mismatches.sql**
- Fixes ALL 306 mismatches automatically
- Creates database triggers to prevent future issues
- Includes verification at the end
- Run this to apply all fixes

---

## 🔧 Step-by-Step Instructions

### Step 1: Backup Your Database

**CRITICAL: Always backup before running fixes!**

```bash
# If using Supabase, use their backup feature
# Or if you have direct database access:
pg_dump your_database > backup_before_mismatch_fixes.sql
```

### Step 2: Verify Current State

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open and run: `verify-data-mismatches.sql`
4. Review the output to see all current mismatches

**Expected Output:**
```
=== COURSE ENROLLMENT MISMATCHES ===
total_mismatches: 50

=== FACULTY STUDENT COUNT MISMATCHES ===
total_mismatches: 50

=== UNIVERSITY STUDENT COUNT MISMATCHES ===
university_name: PPSU University
stored_count: 12044
actual_count: 29
difference: -12015

... (and more)
```

### Step 3: Review What Will Be Fixed

The verification script shows:
- ✅ How many mismatches exist in each category
- ✅ Top 10 worst mismatches for each type
- ✅ Specific examples with stored vs actual values
- ✅ Total summary of all issues

### Step 4: Apply Fixes

1. In **Supabase SQL Editor**
2. Open and run: `fix-all-data-mismatches.sql`
3. Watch the progress messages
4. Review the final verification output

**Expected Progress:**
```
NOTICE: === FIXING COURSE TOTAL_STUDENTS ===
NOTICE: Fixed 50 course total_students mismatches

NOTICE: === FIXING FACULTY TOTAL_COURSES ===
NOTICE: Fixed 35 faculty total_courses mismatches

NOTICE: === FIXING FACULTY TOTAL_STUDENTS ===
NOTICE: Fixed 50 faculty total_students mismatches

NOTICE: === FIXING UNIVERSITY TOTAL_STUDENTS (CRITICAL) ===
NOTICE: Fixed 2 university total_students mismatches

... (and more)

NOTICE: DATA MISMATCH FIXES COMPLETED SUCCESSFULLY!
NOTICE: All 306 data mismatches have been corrected.
NOTICE: Database triggers created to prevent future mismatches.
```

### Step 5: Verify Fixes Were Applied

At the end of the fix script, verification queries run automatically. You should see:

```
NOTICE: Course total_students mismatches remaining: 0
NOTICE: Faculty total_courses mismatches remaining: 0
NOTICE: Faculty total_students mismatches remaining: 0
NOTICE: Student GPA mismatches remaining: 0
NOTICE: Job applications_count mismatches remaining: 0
NOTICE: Skill endorsement mismatches remaining: 0
```

**All counts should be 0!**

---

## 🔍 What Gets Fixed

### 1. Course Enrollment Counts
**Before:**
- CS101: Shows 95 students → Actually has 1 enrollment

**After:**
- CS101: Shows 1 student → Matches actual enrollment

### 2. Faculty Course Counts
**Before:**
- Dr. Lucas Evans: Shows 6 courses → Actually teaches 1 course

**After:**
- Dr. Lucas Evans: Shows 1 course → Matches actual teaching load

### 3. Faculty Student Counts
**Before:**
- Dr. Lucas Evans: Shows 294 students → Actually has 2 students

**After:**
- Dr. Lucas Evans: Shows 2 students → Matches actual enrollments

### 4. University Totals
**Before:**
- PPSU University: Shows 12,044 students → Actually has 29 students
- PPSU University: Shows 217 faculty → Actually has 4 faculty

**After:**
- PPSU University: Shows 29 students → Matches actual count
- PPSU University: Shows 4 faculty → Matches actual count

### 5. Department Totals
**Before:**
- Computer Science: Shows 500 students → Actually has 15 students

**After:**
- Computer Science: Shows 15 students → Matches actual count

### 6. Student GPA
**Before:**
- Student ENR20230012: Shows 2.61 in students table → 3.80 in transcripts

**After:**
- Student ENR20230012: Shows 3.80 in both tables (synced from transcripts)

### 7. Job Application Counts
**Before:**
- Senior Developer job: Shows 5 applications → Actually has 3

**After:**
- Senior Developer job: Shows 3 applications → Matches actual count

### 8. Skill Endorsements
**Before:**
- JavaScript skill: Shows 5 endorsements → Actually has 3

**After:**
- JavaScript skill: Shows 3 endorsements → Matches actual count

---

## 🛡️ Prevention: Database Triggers Created

The fix script creates **6 triggers** to prevent future mismatches:

### 1. `trg_update_course_total_students`
- Fires when: Enrollment added/removed/changed
- Updates: `courses.total_students` automatically

### 2. `trg_update_faculty_total_courses`
- Fires when: Course added/removed/instructor changed
- Updates: `faculty.total_courses` automatically

### 3. `trg_update_faculty_total_students`
- Fires when: Enrollment added/removed
- Updates: `faculty.total_students` automatically

### 4. `trg_update_job_applications_count`
- Fires when: Application added/removed
- Updates: `jobs.applications_count` automatically

### 5. `trg_update_skill_endorsements_count`
- Fires when: Endorsement added/removed
- Updates: `user_skills.endorsements` automatically

### 6. `trg_sync_student_gpa`
- Fires when: Transcript GPA updated
- Updates: `students.gpa` automatically

**Result:** Counts stay synchronized automatically going forward!

---

## ⚠️ Important Notes

### About University Totals

The script handles the fact that `students.university` references university **names** instead of IDs. This is a known issue that should be fixed separately (see Issue #3 in the main audit report).

The fix script works around this by joining on `university_name`, but the permanent fix is to change the students table to use `university_id`.

### About Student GPA

The script treats `transcripts.cumulative_gpa` as the **source of truth** and syncs `students.gpa` to match it. Any future transcript updates will automatically update the students table.

### About Department Totals

Department totals depend on the `students.department` field matching `departments.name`. Make sure these are consistent before running fixes.

---

## 🔄 Re-running the Scripts

### Can I run the fix script multiple times?

**Yes!** The script is **idempotent**, meaning:
- Running it multiple times won't cause errors
- It only updates records that need updating
- Triggers are recreated (using `CREATE OR REPLACE`)

### When should I re-run?

- After importing new CSV data
- If you notice counts are wrong again
- After bulk data operations
- As part of regular maintenance (monthly recommended)

---

## 📊 Monitoring After Fixes

### Check Data Health Regularly

Run the verification script monthly:
```sql
-- In Supabase SQL Editor
\i verify-data-mismatches.sql
```

Should show **0 mismatches** for all categories if triggers are working.

### If Mismatches Appear Again

1. Check if triggers are still active:
```sql
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trg_%update%';
```

2. If triggers missing, re-run the fix script
3. If triggers present, investigate data import processes

---

## 🆘 Troubleshooting

### Error: "relation does not exist"

**Problem:** Table name doesn't match schema

**Solution:** Check your database schema matches the expected table names. The script expects:
- `courses`, `course_enrollments`
- `faculty`, `students`
- `universities`, `departments`
- `jobs`, `job_applications`
- `user_skills`, `skill_endorsements`
- `transcripts`

### Error: "permission denied"

**Problem:** User doesn't have UPDATE or TRIGGER privileges

**Solution:** 
```sql
-- Grant permissions (run as database admin)
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO your_user;
GRANT TRIGGER ON ALL TABLES IN SCHEMA public TO your_user;
```

### Error: "column does not exist"

**Problem:** Column names don't match expected schema

**Solution:** Review your schema. The script expects specific column names like:
- `courses.total_students`
- `faculty.total_courses`, `faculty.total_students`
- `universities.total_students`, `universities.total_faculty`
- `jobs.applications_count`
- `user_skills.endorsements`

### Verification shows remaining mismatches

**Problem:** Triggers didn't update all records

**Solution:**
1. Check trigger definitions are correct
2. Manually run the update queries again
3. Check for database constraint violations
4. Review application logs for errors

---

## 📈 Expected Results

### Before Fix

```
Total Mismatches: 306
- Critical Issues: 159
- High Priority: 35
- Medium Priority: 30
- Low Priority: 82
```

### After Fix

```
Total Mismatches: 0
- All counts synchronized
- Triggers active and monitoring
- Data integrity maintained
```

---

## 🎯 Success Criteria

✅ All verification queries return 0 mismatches
✅ Course totals match enrollment counts
✅ Faculty metrics match actual assignments
✅ University/department aggregates correct
✅ Student GPAs synchronized
✅ Job/skill counts accurate
✅ Triggers created and active

---

## 📞 Support

If you encounter issues:

1. **Check the verification output** - tells you exactly what's wrong
2. **Review error messages** - they indicate specific problems
3. **Test on backup first** - never run on production without testing
4. **Document findings** - note any unexpected behavior

---

## 📝 Summary

| Step | Action | File | Duration |
|------|--------|------|----------|
| 1 | Backup database | Manual | 5 min |
| 2 | Verify current state | verify-data-mismatches.sql | 2 min |
| 3 | Review mismatch report | (output from step 2) | 5 min |
| 4 | Apply all fixes | fix-all-data-mismatches.sql | 3 min |
| 5 | Verify success | (output from step 4) | 1 min |

**Total Time: ~15 minutes**

---

## ✨ Final Notes

- **Always backup before running**
- **Test in development first**
- **Review verification output carefully**
- **Triggers prevent future issues**
- **Monitor regularly with verification script**

The fix script is **comprehensive, safe, and reversible** (if you have backups). It addresses all 306 mismatches found in the audit and sets up automatic prevention for the future.

Good luck! 🚀
