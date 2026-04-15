# ðŸ“¦ Harbor Storage Setup Guide

Complete guide to set up Supabase Storage for the Harbor platform.

## ðŸ“‹ Overview

Harbor uses Supabase Storage for three types of file uploads:

| Bucket | Purpose | Max Size | Access |
|--------|---------|----------|--------|
| **avatars** | User profile pictures | 5MB | Public read, owner write |
| **resumes** | Student CV/Resume files | 10MB | Authenticated read, owner write |
| **credentials** | University certificates/credentials | 10MB | Authenticated read, owner write |

---

## âœ… Prerequisites

Before setting up storage, ensure you have:

- [x] Supabase project created
- [x] Environment variables configured (`.env.local`)
- [x] Database schema deployed (`database-schema.sql`)
- [x] Authentication enabled

---

## ðŸš€ Step-by-Step Setup

### **Step 1: Access Supabase Dashboard**

1. Go to https://app.supabase.com
2. Sign in to your account
3. Select your **Harbor project**
4. Your project URL: `https://clvadccdadymkkvoczsh.supabase.co`

---

### **Step 2: Deploy Storage SQL**

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `setup-storage-buckets.sql` in your project
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

**What this does:**
- âœ… Creates 3 storage buckets (avatars, resumes, credentials)
- âœ… Sets up Row Level Security (RLS) policies
- âœ… Updates database schema with storage URL columns
- âœ… Enables Realtime for notifications

---

### **Step 3: Verify Buckets Created**

1. In Supabase Dashboard, click **Storage** (left sidebar)
2. You should see 3 buckets:
   - ðŸ–¼ï¸ **avatars** (Public)
   - ðŸ“„ **resumes** (Public)
   - ðŸŽ“ **credentials** (Public)

3. Click on each bucket to verify it's empty and ready

---

### **Step 4: Configure File Size Limits (Optional)**

By default, Supabase allows up to **50MB** uploads. Our limits are enforced in code:

**In Supabase Dashboard:**
1. Go to **Settings** â†’ **Storage**
2. Set **Upload file size limit**: `50 MB` (default)
3. No changes needed - we enforce limits in application code

**Client-side limits** (already configured in your code):
- Avatars: 5MB
- Resumes: 10MB
- Credentials: 10MB

---

### **Step 5: Test the Setup**

Let's test if storage is working:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create a test user:**
   - Navigate to http://localhost:3000/register
   - Sign up as a student
   - Complete the profile

3. **Upload an avatar:**
   - Go to profile settings
   - Upload a profile picture
   - Verify it appears

4. **Check in Supabase:**
   - Go to Storage â†’ avatars bucket
   - You should see: `<user-id>/<user-id>-<timestamp>.jpg`

---

## ðŸ”§ How It Works

### **File Upload Flow**

```
User selects file
    â†“
Client validates (size, type)
    â†“
Call uploadFile() server action
    â†“
Generate unique path: userId/userId-timestamp.ext
    â†“
Upload to Supabase Storage
    â†“
Get public URL
    â†“
Save URL to database (profiles/students/credentials)
    â†“
Return success to client
```

### **Storage Functions Available**

Your project has these storage utilities in `lib/actions/storage.ts`:

```typescript
// Upload avatar
uploadAvatar(file: File, userId: string)

// Upload resume
uploadResume(file: File, userId: string)

// Upload credential document
uploadCredentialDocument(file: File, userId: string)

// Delete any file
deleteFile(bucket: string, filePath: string)

// Get file URL
getFileUrl(bucket: string, filePath: string)
```

---

## ðŸ” Security Policies

### **Row Level Security (RLS) Rules**

All buckets have RLS enabled with these policies:

#### **Avatars:**
- âœ… Anyone can read (public)
- âœ… Authenticated users can upload to their own folder
- âœ… Users can update/delete their own avatars only

#### **Resumes:**
- âœ… Authenticated users can read all (recruiters need access)
- âœ… Users can upload to their own folder only
- âœ… Users can update/delete their own resumes only

#### **Credentials:**
- âœ… Authenticated users can read all (for verification)
- âœ… Users can upload to their own folder only
- âœ… Users can update/delete their own credentials only

**Folder Structure:**
```
avatars/
  â”œâ”€ user-id-1/
  â”‚   â””â”€ user-id-1-1234567890.jpg
  â””â”€ user-id-2/
      â””â”€ user-id-2-9876543210.png

resumes/
  â””â”€ student-id/
      â””â”€ student-id-timestamp.pdf

credentials/
  â””â”€ user-id/
      â””â”€ user-id-timestamp.pdf
```

---

## ðŸ’» Usage Examples

### **Example 1: Upload Avatar in Profile Page**

```typescript
'use client'

import { uploadAvatar } from '@/lib/actions/storage'
import { updateUserProfile } from '@/lib/actions/mutations'
import { useState } from 'react'

export function AvatarUpload({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large! Max size is 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploading(true)
    
    // Upload to storage
    const result = await uploadAvatar(file, userId)
    
    if (result.success) {
      // Update profile with new avatar URL
      await updateUserProfile(userId, { 
        avatar_url: result.url 
      })
      alert('Avatar updated successfully!')
    } else {
      alert('Upload failed: ' + result.error)
    }
    
    setUploading(false)
  }

  return (
    <input 
      type="file" 
      accept="image/*"
      onChange={handleUpload}
      disabled={uploading}
    />
  )
}
```

### **Example 2: Upload Resume**

```typescript
import { uploadResume } from '@/lib/actions/storage'
import { updateStudentProfile } from '@/lib/actions/mutations'

const handleResumeUpload = async (file: File, studentId: string) => {
  // Validate
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Resume must be under 10MB')
  }

  if (!file.type.includes('pdf') && !file.type.includes('word')) {
    throw new Error('Only PDF and Word documents accepted')
  }

  // Upload
  const result = await uploadResume(file, studentId)
  
  if (result.success) {
    // Save URL to database
    await updateStudentProfile(studentId, { 
      resume_url: result.url 
    })
    return result.url
  } else {
    throw new Error(result.error)
  }
}
```

### **Example 3: Upload Credential Document**

```typescript
import { uploadCredentialDocument } from '@/lib/actions/storage'
import { createCredential } from '@/lib/actions/mutations'

const handleCredentialUpload = async (
  file: File,
  userId: string,
  credentialName: string
) => {
  const result = await uploadCredentialDocument(file, userId)
  
  if (result.success) {
    // Create credential record in database
    await createCredential(userId, {
      credential_name: credentialName,
      document_url: result.url,
      issue_date: new Date().toISOString()
    })
    
    return result.url
  }
  
  throw new Error(result.error || 'Upload failed')
}
```

---

## ðŸ› Troubleshooting

### **Issue: "new row violates row-level security policy"**

**Cause:** RLS policy blocking the upload

**Solutions:**
1. Verify user is authenticated
2. Check the file path follows format: `userId/filename`
3. Ensure storage policies are deployed
4. Verify user ID matches authenticated user

```sql
-- Check if policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

---

### **Issue: "Failed to upload file"**

**Cause:** Network error or file too large

**Solutions:**
1. Check internet connection
2. Verify file size is under limit
3. Check Supabase project status
4. Look at browser console for errors

---

### **Issue: "File uploaded but not visible"**

**Cause:** Bucket not public or incorrect URL

**Solutions:**
1. Verify bucket is set to **public**
2. Check the URL format: `https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>`
3. Ensure file actually exists in Storage dashboard

---

### **Issue: "Realtime notifications not working"**

**Cause:** Table not added to realtime publication

**Solutions:**
```sql
-- Check realtime tables
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Add table to realtime
ALTER publication supabase_realtime ADD TABLE notifications;
```

---

## ðŸ“Š Monitoring & Maintenance

### **View Storage Usage**

1. Go to Supabase Dashboard â†’ **Settings** â†’ **Usage**
2. Check **Storage** section
3. Monitor:
   - Total storage used
   - Number of files
   - Bandwidth consumed

### **Free Tier Limits:**
- Storage: **1 GB**
- Bandwidth: **2 GB/month**
- File size: **50 MB max**

### **Clean Up Old Files**

```typescript
// Delete old avatar when uploading new one
import { deleteFile } from '@/lib/actions/storage'

// Get old avatar path from database
const oldPath = user.avatar_url.split('/').slice(-2).join('/')

// Delete old file
await deleteFile('avatars', oldPath)

// Upload new file
const result = await uploadAvatar(newFile, userId)
```

---

## âœ… Verification Checklist

After setup, verify:

- [ ] 3 storage buckets created (avatars, resumes, credentials)
- [ ] All RLS policies applied (4 per bucket = 12 total)
- [ ] Database columns added (resume_url, document_url)
- [ ] Realtime enabled for notifications table
- [ ] Can upload avatar from profile page
- [ ] Can upload resume from student profile
- [ ] Files stored in correct user folders
- [ ] Public URLs accessible
- [ ] Old files can be deleted
- [ ] Unauthorized access blocked

---

## ðŸ“š Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Limits](https://supabase.com/docs/guides/storage/uploads)

---

## ðŸŽ‰ Success!

Your Harbor storage is now configured! Users can:
- âœ… Upload profile pictures
- âœ… Upload resumes for job applications
- âœ… Upload credential documents
- âœ… Securely access their files
- âœ… Have recruiters view their resumes

**Next Steps:**
1. Test file uploads in development
2. Implement file validation in UI
3. Add progress indicators for uploads
4. Set up file compression (optional)
5. Deploy to production

---

**Need help?** Check the troubleshooting section or review the storage action functions in `lib/actions/storage.ts`.

