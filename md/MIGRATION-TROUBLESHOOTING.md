# 🔧 Database Migration Troubleshooting Guide

## Error: "column 'department_id' does not exist"

### What Happened
This error occurs when:
1. The `courses` table was created but the `departments` table wasn't
2. A previous migration attempt partially completed
3. Tables exist from an earlier schema version

### Solution: Use the Safe Migration Script

I've created **database-schema-SAFE-MIGRATION.sql** which handles this automatically.

#### Quick Fix (5 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Harbor project
   - Click "SQL Editor"

2. **Run the Safe Migration**
   ```sql
   -- Open database-schema-SAFE-MIGRATION.sql
   -- Copy ALL content
   -- Paste into Supabase SQL Editor
   -- Click "Run"
   ```

3. **What This Does**
   - Checks which tables already exist
   - Creates only missing tables
   - Preserves existing data
   - Shows "Created table: ..." or "Table already exists: ..." for each table
   - Creates all indexes and RLS policies safely

4. **Verify Success**
   Look for this at the end:
   ```
   TABLES CREATED: 9
   ```

### Alternative: Clean Migration (Deletes Data)

If the safe migration still fails, you need a clean start:

1. **Open database-schema-extended.sql**

2. **Uncomment the DROP TABLE section** (lines 9-18):
   ```sql
   -- Change this:
   /*
   DROP TABLE IF EXISTS public.career_insights CASCADE;
   DROP TABLE IF EXISTS public.user_skills CASCADE;
   ...
   */

   -- To this (remove /* and */):
   DROP TABLE IF EXISTS public.career_insights CASCADE;
   DROP TABLE IF EXISTS public.user_skills CASCADE;
   DROP TABLE IF EXISTS public.student_full_records CASCADE;
   DROP TABLE IF EXISTS public.academic_records CASCADE;
   DROP TABLE IF EXISTS public.student_projects CASCADE;
   DROP TABLE IF EXISTS public.courses CASCADE;
   DROP TABLE IF EXISTS public.admin_staff CASCADE;
   DROP TABLE IF EXISTS public.faculty CASCADE;
   DROP TABLE IF EXISTS public.departments CASCADE;
   ```

3. **Run in Supabase SQL Editor**
   - This will DROP all tables (deleting data)
   - Then recreate them fresh
   - ⚠️ WARNING: This deletes all data in these tables!

4. **Verify with database-verification.sql**

### Other Common Migration Errors

#### Error: "relation already exists"
**Meaning**: Table was created in previous attempt  
**Solution**: Use database-schema-SAFE-MIGRATION.sql (handles this automatically)

#### Error: "permission denied"
**Meaning**: Not enough database permissions  
**Solution**: 
- Verify you're logged into correct Supabase project
- Check you're using the project owner account
- Try using service role key if available

#### Error: "foreign key violation"
**Meaning**: Referenced table doesn't exist yet  
**Solution**: Tables must be created in order (use SAFE-MIGRATION script)

#### Error: "syntax error near ..."
**Meaning**: SQL copied incorrectly or partial copy  
**Solution**: 
- Make sure you copied the ENTIRE file
- Don't modify the SQL manually
- Copy from raw file in VS Code

### Verification Steps After Migration

Run this in Supabase SQL Editor:

```sql
-- Quick check
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY table_name;
```

**Expected result**: 9 rows showing all table names

### Still Having Issues?

1. **Check Supabase Logs**
   - Dashboard → Logs → Postgres Logs
   - Look for detailed error messages

2. **Verify Profiles Table Exists**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```
   If this doesn't exist, run the main database-schema.sql first

3. **Check for Conflicting Tables**
   ```sql
   -- See all your tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

4. **Nuclear Option: Start Fresh**
   ```sql
   -- ⚠️ CAUTION: Deletes EVERYTHING
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   
   -- Then run your main schema + extended schema
   ```

### Files for Migration

| File | Purpose | When to Use |
|------|---------|-------------|
| **database-schema-SAFE-MIGRATION.sql** | Safe migration with checks | **Use this first!** |
| database-schema-extended.sql | Original migration | If safe version unavailable |
| database-verification.sql | Verify success | After any migration |

### Success Checklist

After successful migration, you should see:

- [x] 9 tables created (departments, faculty, admin_staff, courses, student_projects, academic_records, student_full_records, user_skills, career_insights)
- [x] 18+ indexes created
- [x] 20+ RLS policies created
- [x] All tables have RLS enabled
- [x] No error messages in Supabase
- [x] Verification script shows "TABLES CREATED: 9"

### Next Steps After Successful Migration

Once migration succeeds:

1. **Return to QUICK-START.md** at "Minute 10-15: Replace Components"
2. Continue with replacing the component files
3. Test the updated pages
4. Celebrate! 🎉

### Need More Help?

- Check the main error message carefully
- Look at Supabase Postgres Logs for details
- Run verification script to see what's actually created
- Try the SAFE-MIGRATION script first, always
- Only use DROP TABLE as last resort

**Remember**: The SAFE-MIGRATION script is designed to handle most edge cases automatically!
