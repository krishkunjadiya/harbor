# ðŸš€ Quick Start: Supabase Import

## Three Ways to Import

### 1ï¸âƒ£ **PowerShell Script (Recommended)**

```powershell
# Navigate to seed-csv folder
cd "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor\seed-csv"

# Run import script
.\import-to-supabase.ps1 -ProjectRef "your-project-ref" -DatabasePassword "your-password"

# Verify import
.\verify-import.ps1 -ProjectRef "your-project-ref" -DatabasePassword "your-password"
```

**Get your credentials:**
- Project Ref: Supabase Dashboard â†’ Project Settings â†’ General â†’ Reference ID
- Password: Supabase Dashboard â†’ Project Settings â†’ Database â†’ Database password

---

### 2ï¸âƒ£ **Supabase Dashboard (UI)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Table Editor**
3. For each table:
   - Click table name
   - Click **"Insert"** â†’ **"Import data from CSV"**
   - Upload corresponding CSV file
   - Click **"Import"**

**Import Order:**
```
1. universities, departments, skills, Credentials
2. profiles â† MUST BE FIRST!
3. students, faculty, recruiters, admins
4. courses, jobs, projects
5. enrollments, assignments, grades, job_applications
6. (all other tables)
```

---

### 3ï¸âƒ£ **SQL Editor (Fast)**

1. Upload all CSVs to Supabase Storage
2. Create public bucket: `csv-imports`
3. Upload all 28 CSV files
4. Go to **SQL Editor**
5. Copy commands from `SUPABASE_IMPORT_GUIDE.md`
6. Replace URLs with your storage URLs
7. Run queries in order

---

## ðŸ“ Files Included

| File | Purpose |
|------|---------|
| `SUPABASE_IMPORT_GUIDE.md` | Complete guide with SQL commands |
| `import-to-supabase.ps1` | Automated PowerShell import script |
| `verify-import.ps1` | Data verification script |
| `QUICK_START_SUPABASE.md` | This file |
| `FIXES_COMPLETED.md` | What was fixed in the data |

---

## âœ… Pre-Import Checklist

- [ ] Supabase project created
- [ ] Database tables created (schema matches CSVs)
- [ ] PostgreSQL client (psql) installed (for scripts)
- [ ] Project Reference ID copied
- [ ] Database password saved
- [ ] RLS disabled (temporarily) for import

---

## ðŸ” Post-Import Checklist

- [ ] Run verification script
- [ ] Check row counts match expected values
- [ ] Verify FK integrity (0 orphaned records)
- [ ] Enable RLS on all tables
- [ ] Configure authentication
- [ ] Test with application
- [ ] Remove public access from CSV storage

---

## ðŸ“Š Expected Results

| Table | Expected Rows |
|-------|---------------|
| profiles | 143 |
| students | 50 |
| faculty | 50 |
| recruiters | 50 |
| courses | 50 |
| jobs | 100 |

**All FK checks should return 0 orphaned records.**

---

## ðŸ†˜ Common Issues

### "psql not found"
Install PostgreSQL: https://www.postgresql.org/download/windows/

### "Permission denied"
Disable RLS temporarily:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Re-enable after import
```

### "Foreign key violation"
Import in correct order! Profiles MUST be imported before students/faculty/recruiters.

### "Duplicate key value"
Tables already have data. Truncate first:
```sql
TRUNCATE profiles, students, faculty CASCADE;
```

---

## ðŸ’¡ Quick Commands

### Get database URL
```
postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

### Test connection
```powershell
psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" -c "SELECT version();"
```

### Count all rows
```sql
SELECT COUNT(*) FROM profiles;
```

---

## ðŸŽ¯ Fastest Method

**For production/large datasets:**
```powershell
# One command to import everything
.\import-to-supabase.ps1 -ProjectRef "abc123" -DatabasePassword "your-password"

# One command to verify
.\verify-import.ps1 -ProjectRef "abc123" -DatabasePassword "your-password"
```

---

## ðŸ“š Documentation

- Full Guide: `SUPABASE_IMPORT_GUIDE.md`
- Data Fixes: `FIXES_COMPLETED.md`
- Validation Report: `DATA_VALIDATION_REPORT.md`
- FK Reference: `QUICK_REFERENCE.md`

---

**Status: Ready to import! All 28 CSV files are production-ready.** âœ…

