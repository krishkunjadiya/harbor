# CSV vs Database Schema Column Comparison

## Summary

All 9 tables were analyzed for column mismatches between CSV files and database schema (database-schema-extended.sql).

### Key Findings:

**MISSING IN DATABASE (CSV has, DB doesn't):**
- All 9 tables missing CSV compatibility ID columns (department_id, faculty_id, etc.)
- faculty: missing `status` column
- admin_staff: missing `status` column

**MISSING IN CSV (DB has, CSV doesn't):**
- All 9 tables missing `id` column (UUID PRIMARY KEY)

---

## Detailed Comparison by Table

### 1. DEPARTMENTS
**CSV Columns (12):** department_id, university_id, name, code, head_of_department, established, description, total_students, total_faculty, total_courses, created_at, updated_at

**DB Columns (12):** id, university_id, name, code, head_of_department, established, description, total_students, total_faculty, total_courses, created_at, updated_at

**Missing in DB:**
- `department_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 2. FACULTY
**CSV Columns (15):** faculty_id, profile_id, university_id, department_id, name, email, phone, position, specialization, join_date, total_courses, total_students, status, created_at, updated_at

**DB Columns (14):** id, profile_id, university_id, department_id, name, email, phone, position, specialization, join_date, total_courses, total_students, created_at, updated_at

**Missing in DB:**
- `faculty_id TEXT UNIQUE` (CSV compatibility ID)
- `status TEXT DEFAULT 'active'`

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 3. ADMIN_STAFF
**CSV Columns (13):** admin_id, profile_id, university_id, name, email, phone, department, position, responsibilities, join_date, status, created_at, updated_at

**DB Columns (12):** id, profile_id, university_id, name, email, phone, department, position, responsibilities, join_date, created_at, updated_at

**Missing in DB:**
- `admin_id TEXT UNIQUE` (CSV compatibility ID)
- `status TEXT DEFAULT 'active'`

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 4. COURSES
**CSV Columns (14):** course_id, department_id, instructor_id, code, name, description, credits, semester, year, total_students, max_students, status, created_at, updated_at

**DB Columns (14):** id, department_id, instructor_id, code, name, description, credits, semester, year, total_students, max_students, status, created_at, updated_at

**Missing in DB:**
- `course_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

**Note:** CSV has `status` but DB already has `status` with CHECK constraint

---

### 5. STUDENT_PROJECTS
**CSV Columns (24):** project_id, student_id, course_id, title, description, course_name, team_members, student_ids, mentor, status, progress, start_date, end_date, presentation_date, tags, grade, technologies, github_url, demo_url, proposal_status, midterm_status, final_status, created_at, updated_at

**DB Columns (24):** id, student_id, course_id, title, description, course_name, team_members, student_ids, mentor, status, progress, start_date, end_date, presentation_date, tags, grade, technologies, github_url, demo_url, proposal_status, midterm_status, final_status, created_at, updated_at

**Missing in DB:**
- `project_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 6. ACADEMIC_RECORDS
**CSV Columns (15):** record_id, student_id, course_id, student_name, course_code, course_name, semester, year, grade, credits, verified, submitted_date, verified_date, created_at, updated_at

**DB Columns (15):** id, student_id, course_id, student_name, course_code, course_name, semester, year, grade, credits, verified, submitted_date, verified_date, created_at, updated_at

**Missing in DB:**
- `record_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 7. STUDENT_FULL_RECORDS
**CSV Columns (14):** record_id, student_id, student_name, student_email, enrollment_id, department, semester, year, gpa, credits_earned, courses, status, created_at, updated_at

**DB Columns (14):** id, student_id, student_name, student_email, enrollment_id, department, semester, year, gpa, credits_earned, courses, status, created_at, updated_at

**Missing in DB:**
- `record_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 8. USER_SKILLS
**CSV Columns (9):** user_skill_id, user_id, skill_name, skill_category, proficiency_level, verified, endorsements, created_at, updated_at

**DB Columns (9):** id, user_id, skill_name, skill_category, proficiency_level, verified, endorsements, created_at, updated_at

**Missing in DB:**
- `user_skill_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

### 9. CAREER_INSIGHTS
**CSV Columns (12):** insight_id, student_id, readiness_score, skills_match, experience_level, profile_completeness, recommended_jobs, salary_insights, skill_trends, career_paths, generated_at, updated_at

**DB Columns (12):** id, student_id, readiness_score, skills_match, experience_level, profile_completeness, recommended_jobs, salary_insights, skill_trends, career_paths, generated_at, updated_at

**Missing in DB:**
- `insight_id TEXT UNIQUE` (CSV compatibility ID)

**Missing in CSV:**
- `id UUID PRIMARY KEY` (auto-generated database ID)

---

## Solutions Provided

### 1. SQL Script: sync-schema-with-csv.sql
**Purpose:** Add missing columns from CSV files to database tables

**Changes:**
- Adds CSV compatibility ID columns to all 9 tables
- Adds `status` column to faculty and admin_staff tables
- Creates indexes for all new CSV compatibility columns

**Usage:**
```bash
# Run in Supabase SQL Editor
Run sync-schema-with-csv.sql
```

### 2. Python Script: add_uuid_to_csvs.py
**Purpose:** Add missing UUID `id` column to all CSV files

**Changes:**
- Adds `id` (UUID) as first column to all CSV files
- Generates unique UUIDs for each existing row
- Preserves all existing data and columns

**Usage:**
```bash
cd seed-csv
python add_uuid_to_csvs.py
```

---

## Dual-ID Strategy

After running both scripts, all tables will support a dual-ID approach:

1. **id (UUID)** - Database primary key
   - Auto-generated by PostgreSQL
   - Used for database relationships (FKs)
   - Unique across entire system

2. **{table}_id (TEXT)** - CSV import identifier
   - Human-readable (e.g., "dep-0001", "fac-0042")
   - Used for CSV data consistency
   - Useful for debugging and data tracking

---

## Deployment Steps

1. **First: Run SQL Script**
   ```sql
   -- In Supabase SQL Editor
   -- File: sync-schema-with-csv.sql
   ```

2. **Second: Run Python Script**
   ```bash
   cd seed-csv
   python add_uuid_to_csvs.py
   ```

3. **Third: Import CSVs**
   - Import via Supabase Table Editor
   - Or use PowerShell import scripts
   - Order: departments → faculty → admin_staff → courses → student_projects → academic_records → student_full_records → user_skills → career_insights

4. **Fourth: Verify**
   ```sql
   -- Check all tables have both ID columns
   SELECT id, department_id FROM departments LIMIT 5;
   SELECT id, faculty_id FROM faculty LIMIT 5;
   -- etc.
   ```

---

## Notes

- All CSV files use semicolons (;) for array delimiters in TEXT[] columns
- Courses table status has CHECK constraint in DB: `CHECK (status IN ('active', 'inactive', 'archived'))`
- Student projects status has CHECK constraint in DB: `CHECK (status IN ('in-progress', 'submitted', 'graded', 'archived'))`
- No data type conflicts found - all column types match between CSV and DB schema
