# Supabase Setup Guide - If Project is Missing/Deleted

## Current Issue
Your Supabase project `clvadccdadymkkvoczsh` is not responding.

## Option 1: Resume Paused Project (RECOMMENDED)
1. Go to https://supabase.com/dashboard
2. Find your project in the list
3. If it shows "Paused", click "Resume"
4. Wait 60-90 seconds
5. Try the app again

## Option 2: Create New Project (If deleted/missing)

### Step 1: Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `Harbor`
4. Database Password: (choose a strong password - SAVE IT!)
5. Region: Choose closest to you
6. Click "Create Project"
7. Wait 2-3 minutes for setup

### Step 2: Get Project Credentials
1. Click "Settings" → "API"
2. Copy:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon/public key** (long JWT token)

### Step 3: Update .env.local
Replace the current values with your new ones:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-new-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-new-anon-key>
```

### Step 4: Run Database Migrations
```powershell
# Navigate to sql folder
cd sql

# Run each migration in order on Supabase SQL Editor
# Go to Dashboard → SQL Editor → New Query
# Copy/paste and run these files in order:
# 1. 01-schema.sql
# 2. 02-rls-policies.sql  
# 3. 03-triggers.sql
# (and any other numbered files)
```

### Step 5: Seed Data (Optional)
```powershell
# If you have seed data
# Go to SQL Editor and run seed files or
# Run the seed script if you have one
```

### Step 6: Test Login
```powershell
# Restart dev server
pnpm dev

# Try registering a new user at http://localhost:3000/register
```

## Troubleshooting

### "Cannot connect" Error Persists
- Clear browser cache and cookies
- Try incognito/private window
- Check browser console for detailed errors

### "Invalid credentials" 
- Make sure you registered a new user first
- Check the profiles table in Supabase dashboard to see if user exists

### Database is Empty
- Run all migration files from the `sql/` folder
- Verify tables exist in Dashboard → Table Editor
