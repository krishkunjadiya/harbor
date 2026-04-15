# Migration Execution Steps

## Critical: Run This First Before Any Component Updates

### Step 1: Execute Database Schema Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Harbor project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute Schema**
   - Open `database-schema-extended.sql` from this project
   - Copy ALL contents (350+ lines)
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Table Creation**
   After execution, check that these 9 tables were created:
   - ✅ departments
   - ✅ faculty
   - ✅ admin_staff
   - ✅ courses
   - ✅ student_projects
   - ✅ academic_records
   - ✅ student_full_records
   - ✅ user_skills
   - ✅ career_insights

5. **Check for Errors**
   - If any errors appear, read them carefully
   - Common issues:
     - Table already exists → Safe to ignore if migrating again
     - Foreign key violation → Check that referenced tables exist
     - Permission denied → Verify you're using service role key

### Step 2: Verify Indexes and RLS Policies

1. **Check Indexes Created**
   ```sql
   SELECT tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN (
     'departments', 'faculty', 'admin_staff', 'courses', 
     'student_projects', 'academic_records', 'student_full_records',
     'user_skills', 'career_insights'
   )
   ORDER BY tablename, indexname;
   ```
   Should return 18+ indexes

2. **Check RLS Policies**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies 
   WHERE schemaname = 'public'
   AND tablename IN (
     'departments', 'faculty', 'admin_staff', 'courses', 
     'student_projects', 'academic_records', 'student_full_records',
     'user_skills', 'career_insights'
   )
   ORDER BY tablename, policyname;
   ```
   Should return multiple policies per table

3. **Verify RLS is Enabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public'
   AND tablename IN (
     'departments', 'faculty', 'admin_staff', 'courses', 
     'student_projects', 'academic_records', 'student_full_records',
     'user_skills', 'career_insights'
   );
   ```
   All should show `rowsecurity = true`

### Step 3: Test Basic Operations

1. **Test Department Creation**
   ```sql
   -- This should work if you're authenticated as a university admin
   INSERT INTO departments (university_id, name, code, head_of_department, established)
   VALUES (
     'your-university-id-here',
     'Test Department',
     'TEST',
     'Dr. Test',
     '2024'
   );
   
   -- Verify
   SELECT * FROM departments WHERE code = 'TEST';
   
   -- Cleanup
   DELETE FROM departments WHERE code = 'TEST';
   ```

2. **Test RLS Policy**
   ```sql
   -- Should return departments visible to current user
   SELECT * FROM departments LIMIT 5;
   
   -- Should return faculty visible to current user
   SELECT * FROM faculty LIMIT 5;
   ```

### Step 4: Update Component Files

**ONLY proceed with these steps AFTER Step 1-3 are complete!**

#### Phase 1: Critical Updates (Do First)

1. **Replace Student Profile Edit**
   ```powershell
   # Backup current file
   cp app/(student)/profile/edit/page.tsx app/(student)/profile/edit/page-BACKUP.tsx
   
   # Replace with database version
   cp app/(student)/profile/edit/page-DATABASE.tsx app/(student)/profile/edit/page.tsx
   ```

2. **Replace Departments Page**
   ```powershell
   # Backup current file
   cp app/(university)/[org]/admin/departments/departments-client.tsx app/(university)/[org]/admin/departments/departments-client-BACKUP.tsx
   
   # Replace with database version
   cp app/(university)/[org]/admin/departments/departments-client-DATABASE.tsx app/(university)/[org]/admin/departments/departments-client.tsx
   ```

#### Phase 2: Test Critical Updates

1. **Test Student Profile Edit**
   - Navigate to `/profile/edit`
   - Verify profile data loads from database
   - Try editing and saving
   - Verify changes persist in database
   - Check browser console for errors

2. **Test Departments Page**
   - Navigate to `/[org]/admin/departments`
   - Verify departments load from database
   - Try creating a new department
   - Try editing an existing department
   - Try deleting a department
   - Verify all operations work correctly

#### Phase 3: Remaining Updates (After testing Phase 1-2)

Follow the detailed conversion plans in `MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md` for:
- Faculty Members (members-client.tsx)
- Courses (courses/page.tsx)
- Academic Records (academic-records/page.tsx)
- Student Projects (student/projects/page.tsx)
- Student Records (student/records/page.tsx)
- Career Insights (career-insights/page.tsx)
- Skills (skills-client.tsx)
- Capstones (capstones/page.tsx)

### Step 5: Post-Migration Verification

1. **Check all routes still work**
   - Test navigation throughout app
   - Verify no 404 errors
   - Check for console errors

2. **Verify no mock data remains**
   ```powershell
   # Search for hardcoded arrays
   grep -r "useState\(\[{" app/ --include="*.tsx"
   
   # Search for mock data comments
   grep -r "Mock data" app/ --include="*.tsx"
   
   # Search for hardcoded user data
   grep -r "John Doe\|Jane Smith" app/ --include="*.tsx"
   ```

3. **Test CRUD operations for each updated feature**
   - Create new records
   - Read/view existing records
   - Update records
   - Delete records
   - Verify RLS prevents unauthorized access

### Common Issues and Solutions

**Issue**: "relation does not exist"
- **Solution**: Run the schema migration SQL again

**Issue**: "permission denied for table"
- **Solution**: Check RLS policies are correctly applied

**Issue**: "null value in column violates not-null constraint"
- **Solution**: Check form validation is providing all required fields

**Issue**: Component shows "Loading..." forever
- **Solution**: Check browser console for database errors, verify Supabase connection

**Issue**: Data not saving
- **Solution**: Check RLS policies allow INSERT/UPDATE for current user's role

### Rollback Plan

If something goes wrong:

1. **Restore backed-up files**
   ```powershell
   cp app/(student)/profile/edit/page-BACKUP.tsx app/(student)/profile/edit/page.tsx
   cp app/(university)/[org]/admin/departments/departments-client-BACKUP.tsx app/(university)/[org]/admin/departments/departments-client.tsx
   ```

2. **Drop new tables if needed**
   ```sql
   -- CAUTION: This will delete all data!
   DROP TABLE IF EXISTS career_insights CASCADE;
   DROP TABLE IF EXISTS user_skills CASCADE;
   DROP TABLE IF EXISTS student_full_records CASCADE;
   DROP TABLE IF EXISTS academic_records CASCADE;
   DROP TABLE IF EXISTS student_projects CASCADE;
   DROP TABLE IF EXISTS courses CASCADE;
   DROP TABLE IF EXISTS admin_staff CASCADE;
   DROP TABLE IF EXISTS faculty CASCADE;
   DROP TABLE IF EXISTS departments CASCADE;
   ```

### Success Criteria

Migration is complete when:
- ✅ All 9 tables created successfully
- ✅ All indexes and RLS policies applied
- ✅ Student profile edit uses database (no hardcoded data)
- ✅ Departments page uses database (no hardcoded data)
- ✅ All CRUD operations work correctly
- ✅ No console errors on any page
- ✅ RLS prevents unauthorized access
- ✅ No mock data found in codebase search

### Next Steps After Migration

1. Add seed data for testing (optional)
2. Update remaining component files (see Phase 3)
3. Implement comprehensive testing
4. Deploy to production

## Estimated Timeline

- Step 1: Database Migration - 10 minutes
- Step 2: Verification - 5 minutes  
- Step 3: Testing - 10 minutes
- Step 4 Phase 1-2: Critical Updates & Testing - 30 minutes
- Step 4 Phase 3: Remaining Updates - 2-4 hours
- Step 5: Post-Migration Verification - 30 minutes

**Total: ~4-5 hours for complete migration**
