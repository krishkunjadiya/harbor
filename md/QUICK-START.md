# 🚀 Quick Start: Database Migration & Mock Data Removal

> **Goal**: Replace all mock/hardcoded data with real database operations in under 30 minutes for critical features.

## ⚡ Fast Track (30 Minutes)

### Minute 0-10: Database Setup

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Harbor project

2. **Run Migration** (Choose ONE method)
   
   **METHOD A: Safe Migration (Recommended)**
   - Open `database-schema-SAFE-MIGRATION.sql` in VS Code
   - Copy ALL content
   - Paste into Supabase SQL Editor
   - Click "Run" (Ctrl+Enter)
   - You'll see "Created table: ..." messages
   - This handles existing tables gracefully
   
   **METHOD B: Clean Migration (if Method A fails)**
   - Open `database-schema-extended.sql` in VS Code
   - Uncomment the DROP TABLE section (lines 9-18)
   - Copy ALL content
   - Paste into Supabase SQL Editor
   - Click "Run" (Ctrl+Enter)
   - ⚠️ This will delete existing data!

3. **Verify Migration**
   - Click "New Query" again
   - Open `database-verification.sql` in VS Code
   - Copy and paste into SQL Editor
   - Click "Run"
   - Look for: **"🎉 MIGRATION SUCCESSFUL!"**

### Minute 10-15: Replace Components

Run these commands in PowerShell terminal:

```powershell
# Backup originals
Copy-Item "app/(student)/profile/edit/page.tsx" "app/(student)/profile/edit/page-BACKUP.tsx"
Copy-Item "app/(university)/[org]/admin/departments/departments-client.tsx" "app/(university)/[org]/admin/departments/departments-client-BACKUP.tsx"

# Replace with database versions
Copy-Item "app/(student)/profile/edit/page-DATABASE.tsx" "app/(student)/profile/edit/page.tsx" -Force
Copy-Item "app/(university)/[org]/admin/departments/departments-client-DATABASE.tsx" "app/(university)/[org]/admin/departments/departments-client.tsx" -Force
```

### Minute 15-25: Test Everything

```powershell
# Start dev server (if not already running)
pnpm dev
```

**Test 1: Student Profile Edit**
- Navigate to: http://localhost:3000/profile/edit
- ✅ Profile loads with your actual data
- ✅ Can edit and save changes
- ✅ Changes persist after reload
- ✅ No console errors

**Test 2: Departments Management**
- Navigate to: http://localhost:3000/[org]/admin/departments
  (Replace [org] with your university slug)
- ✅ Page loads without errors
- ✅ Can create new department
- ✅ Can edit department
- ✅ Can delete department

### Minute 25-30: Cleanup

```powershell
# Remove temporary files
Remove-Item "app/(student)/profile/edit/page-DATABASE.tsx"
Remove-Item "app/(university)/[org]/admin/departments/departments-client-DATABASE.tsx"

# Commit your changes
git add .
git commit -m "feat: replace mock data with database operations (profile edit + departments)"
```

---

## 📋 What Just Happened?

### Before:
- Student profile edit had hardcoded data: "John Doe", "MIT", hardcoded skills
- Departments page had 6 fake departments in memory
- Data disappeared on page reload
- No real persistence

### After:
- ✅ Profile data loads from `profiles` and `students` tables
- ✅ Profile edits save to database via `updateUserProfile()` and `updateStudentProfile()`
- ✅ Departments load from `departments` table
- ✅ Full CRUD operations: Create, Read, Update, Delete
- ✅ Data persists across sessions
- ✅ RLS policies enforce security

### Database Structure Added:
- 9 new tables created
- 50+ database functions ready to use
- Row Level Security enabled
- Performance indexes added

---

## 🎯 Next Steps (Optional - 4 Hours)

You've completed the critical updates! The app now uses real database for:
- ✅ Student profiles
- ✅ Department management

8 more features still have mock data. To convert them, follow **[MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md](MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md)**.

Priority order:
1. **Faculty Members** (45 min) - 7 hardcoded members → database
2. **Courses** (30 min) - Empty array → database
3. **Academic Records** (30 min) - Connect to database
4. **Student Projects** (20 min) - Refine existing DB connection
5. **Student Records** (30 min) - Connect to database
6. **Capstones** (30 min) - Connect to database
7. **Skills** (30 min) - Remove hardcoded userId
8. **Career Insights** (45 min) - Replace mock AI data

---

## 🔍 Verification Commands

```powershell
# Check for remaining mock data patterns
Select-String -Path "app/**/*.tsx" -Pattern "useState\(\[{" -Recurse

# Check for hardcoded user data
Select-String -Path "app/**/*.tsx" -Pattern "John Doe|Jane Smith|Dr\. Sarah" -Recurse

# Verify TypeScript compiles
pnpm build

# Run all tests (if you have them)
pnpm test
```

---

## 🆘 Troubleshooting

### Error: "column 'department_id' does not exist"
**Solution**: A partial migration left tables in inconsistent state.
1. Use the **database-schema-SAFE-MIGRATION.sql** file instead
2. Or uncomment the DROP TABLE section in database-schema-extended.sql
3. Run the full migration again

### Error: "relation does not exist"
**Solution**: Migration didn't run successfully. Re-run `database-schema-extended.sql` in Supabase.

### Error: "Missing Supabase credentials"
**Solution**: Check `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Error: "permission denied for table"
**Solution**: RLS policies may not be set correctly. Re-run migration or check policies in Supabase dashboard.

### Page shows "Loading..." forever
**Solution**: 
1. Open browser console (F12)
2. Look for error messages
3. Verify Supabase connection works
4. Check that migration completed successfully

### Data not saving
**Solution**:
1. Check browser console for errors
2. Verify RLS policies allow INSERT/UPDATE
3. Check that all required fields are filled
4. Verify user is authenticated

---

## 📚 Documentation Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[ACTION-PLAN.md](ACTION-PLAN.md)** | Overall project status and next steps | Start here for big picture |
| **[QUICK-START.md](QUICK-START.md)** | This file - fast implementation | You're here! |
| **[MIGRATION-EXECUTION-STEPS.md](MIGRATION-EXECUTION-STEPS.md)** | Detailed migration process | Step-by-step guidance |
| **[MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md](MOCK-DATA-REMOVAL-COMPLETE-GUIDE.md)** | File-by-file conversion guide | Converting remaining files |
| **[database-schema-extended.sql](database-schema-extended.sql)** | Database schema to execute | Run in Supabase SQL Editor |
| **[database-verification.sql](database-verification.sql)** | Verify migration success | After running schema |
| **[lib/actions/database.ts](lib/actions/database.ts)** | All database functions | Reference for available operations |

---

## ✅ Success Checklist

- [ ] Supabase migration executed successfully
- [ ] Verification script shows "🎉 MIGRATION SUCCESSFUL!"
- [ ] Student profile edit page works with database
- [ ] Departments page works with full CRUD
- [ ] No console errors on either page
- [ ] Changes persist after page reload
- [ ] Original files backed up
- [ ] Changes committed to git

**When all checked**: Congratulations! 🎉 You've successfully eliminated mock data from critical features and implemented production-ready database operations.

---

## 🎓 What You Learned

This migration demonstrated:
- Creating database schemas with foreign keys and indexes
- Implementing Row Level Security (RLS) policies
- Server-side data fetching with Supabase
- Form handling with database persistence
- Full CRUD operations (Create, Read, Update, Delete)
- Production-ready data architecture
- Replacing mock data with real persistence

You can now apply these same patterns to any remaining features!

---

**Time to Complete**: 30 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Supabase project setup, environment variables configured  
**Result**: Production-ready database operations for critical features
