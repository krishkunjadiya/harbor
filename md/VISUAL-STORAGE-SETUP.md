# 📸 Visual Storage Setup Instructions

Follow these steps with screenshots in mind.

---

## 🎯 STEP 1: Open Supabase Dashboard

1. **Open your browser**
2. **Go to:** https://app.supabase.com
3. **Sign in** to your account
4. **Click on your project:** Harbor (or your project name)

**Your Project URL:** `https://clvadccdadymkkvoczsh.supabase.co`

---

## 🎯 STEP 2: Navigate to SQL Editor

```
Dashboard → Left Sidebar → SQL Editor
```

**What you'll see:**
- List of queries/templates on the left
- SQL editor in the middle
- Run button at the top

---

## 🎯 STEP 3: Create New Query

1. **Click** the **"New Query"** button (top right)
2. You'll see an empty SQL editor

---

## 🎯 STEP 4: Paste Storage Setup SQL

1. **In VS Code:** Open `setup-storage-buckets.sql`
2. **Press:** `Ctrl+A` (select all)
3. **Press:** `Ctrl+C` (copy)
4. **In Supabase SQL Editor:** Click in the text area
5. **Press:** `Ctrl+V` (paste)

**You should see:**
```sql
-- =============================================
-- HARBOR STORAGE SETUP
-- Run this in Supabase SQL Editor
-- =============================================
...
(all the SQL code)
```

---

## 🎯 STEP 5: Run the SQL

1. **Click** the **"Run"** button (or press `Ctrl+Enter`)
2. **Wait** for execution (usually 2-5 seconds)

**Success message should appear:**
```
✅ Storage buckets and policies created successfully!
✅ Database schema updated with storage URLs
✅ Realtime enabled for notifications and job applications
```

**If you see errors:** Check the troubleshooting section below

---

## 🎯 STEP 6: Verify Buckets Created

```
Dashboard → Left Sidebar → Storage
```

**You should see 3 buckets:**

```
┌─────────────────┬────────┬───────┬──────────────┐
│ Name            │ Public │ Files │ Size         │
├─────────────────┼────────┼───────┼──────────────┤
│ 📷 avatars      │ ✓ Yes  │ 0     │ 0 bytes      │
│ 📄 resumes      │ ✓ Yes  │ 0     │ 0 bytes      │
│ 🎓 credentials  │ ✓ Yes  │ 0     │ 0 bytes      │
└─────────────────┴────────┴───────┴──────────────┘
```

**What each column means:**
- **Name:** Bucket identifier
- **Public:** Whether files have public URLs
- **Files:** Number of files currently stored
- **Size:** Total size of files

---

## 🎯 STEP 7: Check Bucket Policies

1. **Click on** any bucket (e.g., "avatars")
2. **Click** the **"Policies"** tab
3. **You should see 4 policies:**
   - ✅ Users can upload their own avatar
   - ✅ Users can update their own avatar
   - ✅ Users can delete their own avatar
   - ✅ Public avatar access

**Repeat for each bucket** (resumes, credentials)

---

## 🎯 STEP 8: Test in Your Application

### **8.1: Start Development Server**

```bash
# In your terminal (VS Code)
cd "e:\KRISH(PPSU)\Semester 6\Major Project\Harbor"
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

---

### **8.2: Open Application**

1. **Open browser:** http://localhost:3000
2. **You should see:** Harbor landing page

---

### **8.3: Register Test User**

1. **Click** "Register" or go to http://localhost:3000/register
2. **Fill in the form:**
   - Email: test@example.com
   - Password: TestPassword123!
   - User Type: Student
   - Full Name: Test User
3. **Click** "Sign Up"

---

### **8.4: Upload Avatar (Test Storage)**

1. **After registration**, navigate to profile settings
2. **Look for** "Profile Picture" or "Avatar" section
3. **Click** "Upload" or "Choose File"
4. **Select** an image file (< 5MB)
5. **Click** "Upload" or "Save"

**Expected result:**
- ✅ Upload progress indicator
- ✅ Success message
- ✅ Avatar appears on profile
- ✅ Avatar visible in navigation/header

---

### **8.5: Verify in Supabase Storage**

1. **Go back to** Supabase Dashboard
2. **Navigate to:** Storage → avatars
3. **You should see:**
   ```
   avatars/
     └─ <user-id>/
         └─ <user-id>-<timestamp>.jpg
   ```
4. **Click on the file** to see preview and public URL

**Example URL:**
```
https://clvadccdadymkkvoczsh.supabase.co/storage/v1/object/public/avatars/abc123.../abc123...-1737123456.jpg
```

---

## 🎯 STEP 9: Verify Database Updated

1. **In Supabase:** Navigate to **Table Editor**
2. **Select** `profiles` table
3. **Find** your test user row
4. **Check** `avatar_url` column has the storage URL

**Should look like:**
```
https://clvadccdadymkkvoczsh.supabase.co/storage/v1/object/public/avatars/...
```

---

## 🎯 STEP 10: Test Resume Upload (Optional)

1. **In your app**, navigate to student profile
2. **Find** "Resume" or "Upload CV" section
3. **Upload** a PDF file (< 10MB)
4. **Verify** in Supabase Storage → resumes bucket

---

## ✅ Verification Checklist

Mark each as complete:

### **Supabase Setup:**
- [ ] SQL script executed successfully
- [ ] 3 buckets visible in Storage
- [ ] Each bucket has 4 RLS policies
- [ ] Buckets are set to "Public"

### **Database Schema:**
- [ ] `profiles` table has `avatar_url` column
- [ ] `students` table has `resume_url` column
- [ ] `credentials` table has `document_url` column

### **Application Testing:**
- [ ] Dev server starts without errors
- [ ] Can register new user
- [ ] Can upload avatar
- [ ] Avatar appears in UI
- [ ] File appears in Supabase Storage
- [ ] Database URL updated

### **Security:**
- [ ] Can only upload to own folder
- [ ] Can only delete own files
- [ ] Can view public avatars
- [ ] Authenticated users can view resumes

---

## 🐛 Common Issues & Solutions

### **Issue 1: SQL Script Fails**

**Error:** `relation "storage.buckets" does not exist`

**Solution:**
```sql
-- Storage extension might not be enabled
-- This is rare, but check:
SELECT * FROM pg_available_extensions WHERE name = 'storage';

-- If missing, contact Supabase support or recreate project
```

---

### **Issue 2: Buckets Not Appearing**

**Possible causes:**
1. SQL didn't run completely
2. Browser cache issue

**Solutions:**
1. Refresh the page (F5)
2. Re-run the SQL script
3. Check browser console for errors

---

### **Issue 3: Upload Button Doesn't Work**

**Check:**
1. File size (must be under limit)
2. File type (images only for avatar)
3. User is logged in
4. Browser console for errors

**Debug in browser console:**
```javascript
// Check if user is authenticated
console.log('User:', user)

// Check file details
console.log('File:', file.name, file.size, file.type)
```

---

### **Issue 4: "Policy Violation" Error**

**Error:** `new row violates row-level security policy`

**Cause:** File path doesn't match user ID

**Check:**
```typescript
// File path should be:
const filePath = `${userId}/${userId}-${Date.now()}.${fileExt}`

// Not:
const filePath = `uploads/${fileName}` // ❌ Wrong!
```

**Solution:**
Ensure the upload function uses correct path format (already done in `lib/actions/storage.ts`)

---

### **Issue 5: File Uploads But URL is Broken**

**Check:**
1. Bucket is set to **Public** (not Private)
2. URL format is correct
3. File actually exists in bucket

**Test URL manually:**
```
https://clvadccdadymkkvoczsh.supabase.co/storage/v1/object/public/avatars/<user-id>/<filename>
```

Paste in browser - should show the image/file

---

## 📞 Getting Help

**If stuck:**

1. **Check logs:**
   - Browser console (F12)
   - Terminal (where npm run dev is running)
   - Supabase Dashboard → Logs

2. **Verify environment:**
   ```bash
   # In terminal
   Get-Content .env.local
   ```

3. **Check Supabase status:**
   - https://status.supabase.com

4. **Review files:**
   - `lib/actions/storage.ts` (upload functions)
   - `STORAGE-SETUP-GUIDE.md` (detailed guide)
   - `setup-storage-buckets.sql` (SQL script)

---

## 🎉 Success Indicators

**You're done when:**

✅ All 3 buckets created in Supabase
✅ All policies showing in each bucket
✅ Test user registered successfully
✅ Avatar uploaded and visible
✅ File appears in Storage dashboard
✅ Database `avatar_url` populated
✅ No errors in console

---

## 📚 Next Steps After Setup

1. **Implement resume upload UI** in student profile
2. **Add credential upload** for universities
3. **Create file preview components**
4. **Add file compression** (optional)
5. **Implement bulk file operations**
6. **Set up CDN** for production (Supabase handles this)

---

**Ready to go?** Start with **STEP 1** above! 🚀
