# Skill Persistence Bug - Root Cause & Complete Fix

## Problem
Skills added in the UI disappeared after page refresh.

## Root Cause Analysis

### Issue 1: Data Model Mismatch ❌
- **Profile Edit Page** (`/profile/edit`): Saving skills to `user_skills` table ✅
- **Profile View Page** (`/profile`): Loading skills from `students.skills` column ❌
- **Result**: Skills saved to one location, loaded from another → data loss

### Issue 2: Missing Database Table ⚠️
The `user_skills` table may not exist in your Supabase database yet.

## Complete Fix Applied

### 1. Fixed Profile View Page ✅
**File**: `app/(student)/profile/page.tsx`

**Changes**:
```typescript
// BEFORE: Loading from students.skills (wrong source)
const technicalSkills = student?.skills || []

// AFTER: Loading from user_skills table (correct source)
import { getUserSkills } from '@/lib/actions/database'
const userSkills = await getUserSkills(profile.id) || []
const technicalSkills = userSkills.map(s => s.skill_name) || []
```

### 2. Profile Edit Page (Already Correct) ✅
**File**: `app/(student)/profile/edit/page.tsx`

- ✅ Loads skills from `user_skills` table via `getUserSkills()`
- ✅ Adds skills via `createUserSkill()` with immediate DB write
- ✅ Deletes skills via `deleteUserSkill()` with immediate DB write
- ✅ Updates UI only after successful database operation
- ✅ Proper error handling and loading states

### 3. Database Functions (Already Correct) ✅
**File**: `lib/actions/database.ts`

All functions correctly interact with the `user_skills` table:
- `getUserSkills(userId)` - Fetches from database
- `createUserSkill(skill)` - Inserts to database
- `deleteUserSkill(id)` - Deletes from database

## Verification Steps

### Step 1: Verify Database Table Exists

Run this in **Supabase SQL Editor**:

```sql
-- Check if user_skills table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_skills';
```

**Expected**: Should return one row with `table_name = 'user_skills'`

**If table doesn't exist**: Run the migration script:
```bash
# In Supabase SQL Editor, run:
database-schema-SAFE-MIGRATION.sql
```

Or use the verification script:
```bash
verify-user-skills-table.sql
```

### Step 2: Test Skill Persistence

1. **Start development server**:
   ```powershell
   pnpm dev
   ```

2. **Navigate to profile edit**:
   - Go to `http://localhost:3000/profile/edit`
   - Login if needed

3. **Add a skill**:
   - Type "React" in the skill input
   - Click "Add Skill"
   - Verify skill appears in the list
   - Check browser console for any errors

4. **Refresh the page**:
   - Press F5 or refresh browser
   - **Skill should still be visible** ✅

5. **Navigate to profile view**:
   - Go to `http://localhost:3000/profile`
   - Check "Skills" tab
   - **Skill should appear here too** ✅

6. **Remove the skill**:
   - Go back to `/profile/edit`
   - Click X button next to skill
   - Verify skill is removed
   - Refresh page
   - **Skill should stay deleted** ✅

### Step 3: Check Database Directly

In Supabase SQL Editor:

```sql
-- View all skills for debugging
SELECT 
  id,
  user_id,
  skill_name,
  proficiency_level,
  created_at
FROM user_skills
ORDER BY created_at DESC;
```

### Step 4: Verify RLS Policies

Ensure users can only access their own skills:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_skills';

-- Check policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_skills';
```

Expected policies:
- ✅ "Users can view their skills" (SELECT)
- ✅ "Users can manage their skills" (ALL)

## Common Issues & Solutions

### Issue: Table doesn't exist
**Solution**: Run `database-schema-SAFE-MIGRATION.sql` in Supabase

### Issue: "Error fetching user skills: permission denied"
**Solution**: Enable RLS and add policies from migration script

### Issue: Skills save but don't appear on refresh
**Solution**: Check browser console for errors. Verify `getUserSkills()` is being called.

### Issue: "Cannot read property 'id' of undefined"
**Solution**: User not authenticated. Check Supabase auth setup.

## Database Schema Reference

```sql
CREATE TABLE public.user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  proficiency_level INTEGER DEFAULT 50,
  verified BOOLEAN DEFAULT FALSE,
  endorsements INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);
```

## Success Criteria

✅ Skills added in edit page persist after refresh
✅ Skills appear in profile view page
✅ Skills can be deleted and stay deleted
✅ No console errors
✅ Database has records in `user_skills` table
✅ RLS policies protect user data

## Files Modified

1. ✅ `app/(student)/profile/page.tsx` - Fixed to load from `user_skills` table
2. ✅ `app/(student)/profile/edit/page.tsx` - Already using correct pattern
3. ✅ `lib/actions/database.ts` - Database functions already correct
4. 📄 `verify-user-skills-table.sql` - New verification script
5. 📄 `SKILL-PERSISTENCE-FIX.md` - This document

## Next Steps

1. **Verify database table exists** (Step 1 above)
2. **Test the fix** (Step 2 above)
3. **If issues persist**, check:
   - Supabase connection
   - Authentication status
   - Browser console errors
   - Network tab for failed API calls

## Pattern to Follow for Other Features

This fix demonstrates the **production-grade data persistence pattern**:

```typescript
// ✅ CORRECT PATTERN
const addItem = async () => {
  setLoading(true)
  try {
    // 1. Write to database first
    const newItem = await createItemInDatabase(data)
    
    // 2. Verify success
    if (newItem) {
      // 3. Update UI only after DB success
      setItems([...items, newItem])
    } else {
      // 4. Show error if DB write failed
      alert('Failed to save')
    }
  } catch (error) {
    console.error(error)
    alert('Error occurred')
  } finally {
    setLoading(false)
  }
}

// ❌ WRONG PATTERN (causes data loss)
const addItem = () => {
  // Only updates state - no database write!
  setItems([...items, newItem])
}
```

## Prevention

Use the detection script to find similar issues:

```powershell
.\check-persistence.ps1
```

This will identify:
- Hardcoded IDs
- State-only updates
- Missing database writes
- TODO comments about auth
