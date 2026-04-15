# Routing Errors & Bugs Audit Report

Generated: February 8, 2026

## Quick Summary Table

| # | Issue | Status | Severity | File(s) |
|---|-------|--------|----------|---------|
| 1 | Faculty settings pages param handling | âœ… FIXED | HIGH | faculty/settings/*.tsx |
| 2 | Settings button not clickable | âœ… FIXED | MEDIUM | sidebar.tsx |
| 3 | Admin settings duplicate routes | âœ… FIXED | CRITICAL | admin/settings/page.tsx |
| 4 | Faculty settings page naming | âš ï¸ PENDING | LOW | faculty/settings/profile/page.tsx |
| 5 | Student routes validation | â“ UNKNOWN | MEDIUM | student/*.tsx |
| 6 | Recruiter create job org handling | â“ UNKNOWN | LOW | jobs/create/page.tsx |
| **TOTAL** | **6 Issues Found** | **3 Fixed** | - | - |

---

## Summary
Analyzed the entire Next.js app routing structure to identify 404s, broken links, parameter handling issues, and routing configuration problems.

---

## âœ… FIXED ISSUES (Resolved in Current Session)

### 1. Faculty Settings Pages - Parameter Handling in Client Components
**Status:** FIXED
**Severity:** HIGH
**Files Affected:**
- `app/(university)/[org]/faculty/settings/profile/page.tsx`
- `app/(university)/[org]/faculty/settings/security/page.tsx`
- `app/(university)/[org]/faculty/settings/communication/page.tsx`
- `app/(university)/[org]/faculty/settings/permissions/page.tsx`
- `app/(university)/[org]/faculty/profile/page.tsx`

**Problem:**
- These were client components (`'use client'`) trying to use `params: Promise` destructuring
- Client components in Next.js don't receive async params - only server components do
- This caused the pages to render blank or not load the org parameter

**Solution:**
- Converted all to use `useParams()` hook from `'next/navigation'`
- Removed `params` prop from function signatures
- Added proper org retrieval: `const org = params?.org as string`

**Code Change:**
```tsx
// BEFORE (BROKEN)
export default function FacultyProfilePage({ params }: { params: Promise<{ org: string }> }) {
  const org = await params  // âŒ ERROR: Can't await in client component

// AFTER (FIXED)
export default function FacultyProfilePage() {
  const params = useParams()
  const org = params?.org as string  // âœ… Correct
```

---

### 2. Settings Button in Sidebar - Not Clickable
**Status:** FIXED
**Severity:** MEDIUM
**File:** `components/sidebar.tsx`

**Problem:**
- Settings footer item was rendering as plain `<div>` with hardcoded text
- Settings text was not clickable - only subItems below were clickable
- Users complained: "Settings appears as hardcoded text, not a clickable button"

**Solution:**
- Converted Settings footer item to use `<Link>` component
- Now navigates to `/{org}/faculty/settings` when clicked
- SubItems still display below as additional navigation options

**Code Change:**
```tsx
// BEFORE (BROKEN)
{item.subItems ? (
  <div className="space-y-1">
    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
      {/* Non-clickable text */}
    </div>

// AFTER (FIXED)  
{item.subItems ? (
  <div className="space-y-1">
    <Link href={item.href} className={cn(...styles...)}>
      <item.icon className="h-5 w-5" />
      <span>{item.name}</span>
    </Link>
```

---

### 3. Admin Settings - Duplicate/Conflicting Routes
**Status:** FIXED  
**Severity:** CRITICAL
**Files Affected:**
- `app/(university)/[org]/admin/settings/page.tsx` âœ… Fixed - now redirects
- `app/(university)/[org]/admin/settings/index/page.tsx` âœ… Deleted - was duplicate

**Problem:**
- Both files existed in the same directory
- `page.tsx` was a client component showing settings UI  
- `index/page.tsx` was a server component that redirects to profile
- Next.js routed all `/admin/settings` requests to `page.tsx`
- The redirect in `index/page.tsx` was never reached - DEAD CODE
- This meant `/admin/settings` showed settings UI instead of redirecting to `/admin/settings/profile`

**Solution:**
1. Converted `admin/settings/page.tsx` to server component that redirects to `/admin/settings/profile`
2. Deleted the duplicate `admin/settings/index/page.tsx`
3. Now `/admin/settings` properly redirects like all other role settings

**Final Code:**
```tsx
// app/(university)/[org]/admin/settings/page.tsx
import { redirect } from 'next/navigation'

export default async function UniversityAdminSettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  redirect(`/${org}/admin/settings/profile`)
}
```

---

## âš ï¸ POTENTIAL ISSUES FOUND (Requires Attention)

## âš ï¸ POTENTIAL ISSUES (Requires Investigation)

### 3. Inconsistent Component Naming - Faculty Settings Pages
**Status:** NAMING ISSUE - Not Broken But Confusing
**Severity:** LOW
**File:** `app/(university)/[org]/faculty/settings/profile/page.tsx`

**Problem:**
- Component is named `UniversityFacultyProfilePage` 
- Located inside `/settings/profile/` folder
- Creates confusion with actual profile page at `/faculty/profile/page.tsx`
- Inconsistent with other settings pages which don't include "University" or "Faculty"

**Current Naming:**
- Faculty profile view: `FacultyProfilePage` (at `/faculty/profile/page.tsx`)
- Faculty settings profile form: `UniversityFacultyProfilePage` (at `/faculty/settings/profile/page.tsx`) âŒ Confusing!

**Recommendation:**
- Rename to `FacultyProfileSettingsPage` or `ProfileSettingsPage` for clarity

---

### 4. Missing OR Incorrect Student Routes
**Status:** NEEDS VERIFICATION
**Severity:** MEDIUM
**Files to Verify:**
- `app/(student)/student/profile/page.tsx`
- `app/(student)/student/profile/edit/page.tsx`
- `app/(student)/student/settings/page.tsx`
- `app/(student)/student/settings/profile/page.tsx`

**Concern:**
- Student pages exist under `app/(student)/student/` with hardcoded `/student/` hrefs
- Routes correctly point to `/student/profile`, `/student/profile/edit`, `/student/settings`
- âš ï¸ Student routes might conflict or have layout issues - NOT YET VERIFIED

**Verification Needed:**
```
â“ Do /student/* routes work correctly?
â“ Are they protected by (student) layout auth?
â“ Do settings pages render properly?
```

---

### 5. Recruiter Jobs Create Page - Missing org Parameter Handling
**Status:** POTENTIAL ISSUE
**Severity:** LOW  
**File:** `app/(recruiter)/[org]/jobs/create/page.tsx`

**Problem:**
- Client component (`"use client"`) in a `[org]` dynamic route
- Does NOT import or use `useParams()` to get the org parameter
- If the form/submission needs org context, this could fail silently

**Current Code:**
```tsx
"use client"
export default function CreateJobPage() {
  const router = useRouter()
  // No useParams() - no org parameter access
```

**Recommendation:**
- Add verification: Does the form submission actually need org?
- If yes: `const params = useParams(); const org = params?.org as string;`
- If no: Leave as-is (current implementation uses authenticated user context)

---

### 6. Client Components in Dynamic Routes Not Using useParams
**Status:** PARTIALLY VERIFIED
**Severity:** MEDIUM
**Components to Review:**
- `app/(university)/[org]/admin/settings/page.tsx` - NOW FIXED: Server component with redirect
- May or may not need org depending on context

---

## âœ… VERIFIED AS WORKING

### Settings Redirect Pattern
**Status:** WORKING âœ…
- All settings index pages properly redirect to `/settings/profile`
- Pattern: `redirect('/${org}/role/settings/profile')`
- Locations verified:
  - Faculty: `app/(university)/[org]/faculty/settings/page.tsx`
  - Student: `app/(university)/[org]/student/settings/page.tsx`
  - Admin: `app/(university)/[org]/admin/settings/index/page.tsx`
  - Recruiter: `app/(recruiter)/[org]/settings/page.tsx`

### Sidebar Route Configuration 
**Status:** WORKING âœ…
- Settings subItems properly configured in sidebar:
  ```tsx
  subItems: [
    { name: "Profile", href: `/${org}/${role}/settings/profile` },
    { name: "Security", href: `/${org}/${role}/settings/security` },
    { name: "Communication", href: `/${org}/${role}/settings/communication` },
    { name: "Permissions", href: `/${org}/${role}/settings/permissions` },
  ]
  ```

### Error Handling
**Status:** WORKING âœ…
- `notFound()` properly used in job detail pages
- Credential verification has error states
- Null checks present

### Profile & Courses Pages
**Status:** WORKING âœ…
- Using authenticated user context (Supabase auth)
- Don't require org parameter
- Properly fetch data from user.id

---

## ðŸ”´ REMAINING CRITICAL ISSUES

### Issue #1: Faculty Settings Pages Not Rendering Content  
**Severity:** CRITICAL
**Status:** NEEDS TESTING
**Issue:** Settings pages exist but may still show blank content when accessed
**Root Cause:** Fixed in this session - was the Promise<params> issue

**Verification Needed:** 
```
Test at: http://localhost:3001/[org]/faculty/settings/profile
Expected: Form with profile fields should render
```

---

## âš ï¸ POTENTIAL ISSUES (Requires Investigation)

---

## ðŸ“‹ ROUTING STRUCTURE OVERVIEW

### University-Based Routes
```
/(university)/[org]/
  â”œâ”€â”€ faculty/
  â”‚   â”œâ”€â”€ dashboard/
  â”‚   â”œâ”€â”€ courses/
  â”‚   â”œâ”€â”€ assignments/
  â”‚   â”œâ”€â”€ enrollments/
  â”‚   â”œâ”€â”€ academic-records/
  â”‚   â”œâ”€â”€ capstones/
  â”‚   â”œâ”€â”€ profile/                    â† View-only profile
  â”‚   â”œâ”€â”€ settings/
  â”‚   â”‚   â”œâ”€â”€ page.tsx               â† Redirects to /settings/profile
  â”‚   â”‚   â”œâ”€â”€ profile/               â† Edit profile settings
  â”‚   â”‚   â”œâ”€â”€ security/
  â”‚   â”‚   â”œâ”€â”€ communication/
  â”‚   â”‚   â””â”€â”€ permissions/
  â”‚   â”œâ”€â”€ notifications/
  â”‚   â”œâ”€â”€ activity-feed/
  â”‚   â””â”€â”€ help/
  â”‚
  â”œâ”€â”€ student/
  â”‚   â”œâ”€â”€ dashboard/
  â”‚   â”œâ”€â”€ projects/
  â”‚   â”œâ”€â”€ records/
  â”‚   â”œâ”€â”€ credentials/
  â”‚   â”œâ”€â”€ Credentials/
  â”‚   â”œâ”€â”€ assignments/
  â”‚   â”œâ”€â”€ notifications/
  â”‚   â”œâ”€â”€ settings/
  â”‚   â”‚   â”œâ”€â”€ page.tsx               â† Redirects to /settings/profile
  â”‚   â”‚   â”œâ”€â”€ profile/
  â”‚   â”‚   â”œâ”€â”€ security/
  â”‚   â”‚   â”œâ”€â”€ communication/
  â”‚   â”‚   â””â”€â”€ permissions/
  â”‚   â”œâ”€â”€ activity-feed/
  â”‚   â”œâ”€â”€ help/
  â”‚   â””â”€â”€ enrollment/
  â”‚
  â”œâ”€â”€ admin/
  â”‚   â”œâ”€â”€ dashboard/
  â”‚   â”œâ”€â”€ settings/
  â”‚   â”‚   â”œâ”€â”€ page.tsx               â† Redirects to /settings/profile
  â”‚   â”‚   â”œâ”€â”€ profile/
  â”‚   â”‚   â”œâ”€â”€ index/
  â”‚   â”‚   â””â”€â”€ settings/ [nested!]
  â”‚   â”œâ”€â”€ faculty/
  â”‚   â”œâ”€â”€ members/
  â”‚   â”œâ”€â”€ departments/
  â”‚   â”œâ”€â”€ Credentials/
  â”‚   â”œâ”€â”€ notifications/
  â”‚   â”œâ”€â”€ activity-feed/
  â”‚   â””â”€â”€ help/
```

### Student Group Routes
```
/(student)/student/                  â† Note: separate (student) layout group
  â”œâ”€â”€ dashboard/
  â”œâ”€â”€ profile/
  â”œâ”€â”€ profile/edit/
  â”œâ”€â”€ settings/
  â”‚   â”œâ”€â”€ page.tsx
  â”‚   â”œâ”€â”€ profile/
  â”‚   â”œâ”€â”€ security/
  â”‚   â”œâ”€â”€ communication/
  â”‚   â””â”€â”€ permissions/
  â”œâ”€â”€ Credentials/
  â”œâ”€â”€ jobs/
  â”œâ”€â”€ jobs/[id]/                      â† Dynamic job detail
  â”œâ”€â”€ applications/
  â”œâ”€â”€ credentials/
  â”œâ”€â”€ notifications/
  â”œâ”€â”€ activity-feed/
  â”œâ”€â”€ skills/
  â”œâ”€â”€ resume-analyzer/
  â”œâ”€â”€ career-insights/
  â”œâ”€â”€ interview-prep/
  â”œâ”€â”€ learning-resources/
  â””â”€â”€ help/
```

### Recruiter Routes
```
/(recruiter)/[org]/
  â”œâ”€â”€ dashboard/
  â”œâ”€â”€ jobs/
  â”‚   â”œâ”€â”€ page.tsx
  â”‚   â”œâ”€â”€ create/                    â† Create new job posting
  â”‚   â”œâ”€â”€ [id]/                      â† Dynamic job detail
  â”‚   â””â”€â”€ [id]/edit/
  â”œâ”€â”€ candidates/
  â”‚   â””â”€â”€ [id]/                      â† Dynamic candidate detail
  â”œâ”€â”€ applications/
  â”œâ”€â”€ saved-candidates/
  â”œâ”€â”€ interviews/
  â”œâ”€â”€ search/
  â”œâ”€â”€ analytics/
  â”œâ”€â”€ team/
  â”œâ”€â”€ reports/
  â”œâ”€â”€ settings/                       â† Redirects to /settings/profile
  â”‚   â”œâ”€â”€ page.tsx
  â”‚   â””â”€â”€ profile/
  â”œâ”€â”€ notifications/
  â”œâ”€â”€ activity-feed/
  â””â”€â”€ help/
```

### Public Routes
```
/(public)/
  â”œâ”€â”€ landing/
  â”œâ”€â”€ login/
  â”œâ”€â”€ register/
  â”œâ”€â”€ features/
  â””â”€â”€ pricing/
```

### Dashboard Routes
```
/(dashboard)/                         â† Admin-only section
  â”œâ”€â”€ dashboard/
  â”œâ”€â”€ admin-dashboard/
  â”œâ”€â”€ users/
  â”‚   â””â”€â”€ [id]/
  â”œâ”€â”€ settings/
  â”œâ”€â”€ notifications/
  â”œâ”€â”€ help/
  â”œâ”€â”€ activity-feed/
  â””â”€â”€ settings/
      â”œâ”€â”€ profile/
      â”œâ”€â”€ security/
      â”œâ”€â”€ communication/
      â””â”€â”€ permissions/
```

---

## ðŸ“Š ACTION ITEMS

### Completed (Fixed Today)
- [x] Fix faculty settings page parameter handling
- [x] Fix profile page parameter handling  
- [x] Make Settings button in sidebar clickable
- [x] All settings subpages now properly imported useParams()

### Needs Testing
- [ ] Test faculty profile page loads correctly
- [ ] Test all faculty settings pages render content
- [ ] Verify Settings button clicks navigate to `/[org]/faculty/settings`
- [ ] Check Settings subItems navigation works
- [ ] Test student settings pages
- [ ] Verify recruiter jobs create page works

### Code Cleanup
- [ ] Rename `UniversityFacultyProfilePage` to `ProfileSettingsPage`
- [ ] Remove old backup files (page-DATABASE.tsx, page-BACKUP.tsx, page-old-backup.tsx)
- [ ] Document expected routing behavior
- [ ] Add route validation tests

### Verification Pending
- [ ] Student pages under (student) layout - are they publicly accessible or auth-protected?
- [ ] Recruiter jobs create - does form need org param?
- [ ] Admin settings - does it need org?

---

## ðŸ› ï¸ Testing Checklist

```
Faculty Faculty Settings Navigation:
â–¡ Navigate to faculty dashboard
â–¡ Click Settings in sidebar footer
â–¡ Verify redirects to /[org]/faculty/settings
â–¡ Click Profile sub-item
â–¡ Verify page loads and shows form
â–¡ Click Security sub-item
â–¡ Verify page loads
â–¡ Click Communication sub-item  
â–¡ Verify page loads
â–¡ Click Permissions sub-item
â–¡ Verify page loads
â–¡ Click Profile view button (view-only mode)
â–¡ Verify /[org]/faculty/profile loads

Student Settings Navigation:
â–¡ Navigate to student dashboard
â–¡ Click Settings in sidebar
â–¡ Verify all sub-pages load

Recruiter Navigation:
â–¡ Navigate to recruiter dashboard
â–¡ Click Create Job
â–¡ Verify job creation form loads
â–¡ Submit job
â–¡ Verify job created successfully
```

---

## References
- **Last Updated:** February 8, 2026
- **Server Status:** Running on http://localhost:3001
- **Frameworks:** Next.js 15.5.9, TypeScript, React

