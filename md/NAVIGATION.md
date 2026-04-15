# Harbor Navigation System - Implementation Guide

## Overview
Harbor now has a fully functional, role-based navigation system with dynamic sidebars, contextual headers, breadcrumbs, and proper routing across all sections.

---

## Key Components

### 1. Dynamic Sidebar (`components/sidebar.tsx`)
The sidebar automatically adapts based on the current route and user role:

**Student Section** (`/dashboard`, `/profile`, `/skills`, etc.)
- Dashboard
- Profile
- Skills
- Credentials
- Resume Analyzer
- Career Insights
- Notifications
- Settings (with sub-items)
- Logout

**System Admin** (`/admin-dashboard`, `/users`)
- Dashboard
- Users
- Notifications
- Settings (with sub-items)
- Logout

**University Admin** (`/{org}/admin/*`)
- Dashboard
- Departments
- Members
- Settings
- Notifications
- Settings (with sub-items)
- Logout

**University Faculty** (`/{org}/faculty/*`)
- Dashboard
- Courses
- Academic Records
- Capstone Projects
- Notifications
- Settings (with sub-items)
- Logout

**University Student** (`/{org}/student/*`)
- Dashboard
- Academic Records
- Projects
- Credentials
- Notifications
- Settings (with sub-items)
- Logout

**Recruiter** (`/{org}/dashboard`, `/{org}/search`, etc.)
- Dashboard
- Search Candidates
- Job Postings
- Create Job
- Notifications
- Settings (with sub-items)
- Logout

### 2. Enhanced Header (`components/header.tsx`)
Features:
- Mobile sidebar toggle
- Search functionality (with contextual placeholder)
- Notification bell with unread count Credential
- User dropdown menu with:
  - User profile info
  - Quick links (Profile, Settings, Notifications)
  - Logout option

### 3. Breadcrumbs (`components/breadcrumbs.tsx`)
- Automatically generated from current URL path
- Hidden on public pages (landing, login, register)
- Shows navigation hierarchy
- Click to navigate to parent pages

### 4. Layouts

**Section Layouts:**
- `app/(student)/layout.tsx` - Student portal
- `app/(dashboard)/layout.tsx` - System admin
- `app/(university)/layout.tsx` - University sections
- `app/(recruiter)/layout.tsx` - Recruiter portal
- `app/shared/layout.tsx` - Shared pages (notifications, Credential verification)

All layouts include:
- SidebarProvider (state management)
- Sidebar (role-based navigation)
- Header (search, notifications, user menu)
- Breadcrumbs (contextual navigation)

---

## Navigation Flow

### Public Flow
```
Landing â†’ Features/Pricing â†’ Login â†’ Register
```

All public pages have inline navigation headers (no sidebar).

### Student Flow
```
/dashboard â†’ Profile â†’ Skills â†’ Credentials â†’ Resume Analyzer â†’ Career Insights
                â†“
           Settings (Profile, Security, Communication, Permissions)
                â†“
           Notifications
```

### University Admin Flow
```
/{org}/admin/dashboard â†’ Departments â†’ Members â†’ Settings
```

### Faculty Flow
```
/{org}/faculty/dashboard â†’ Courses â†’ Academic Records â†’ Capstones
```

### Recruiter Flow
```
/{org}/dashboard â†’ Search â†’ Candidates â†’ Jobs â†’ Create Job
```

---

## Dynamic Route Parameters

### University Routes
Use `[org]` dynamic parameter:
- `/tech-university/admin/dashboard`
- `/innovation-institute/faculty/courses`
- `/global-university/student/records`

### Recruiter Routes
Use `[org]` dynamic parameter:
- `/techcorp/dashboard`
- `/startupx/search`
- `/google/jobs`

### User/Candidate Detail Routes
Use `[id]` dynamic parameter:
- `/users/1` (System admin)
- `/techcorp/candidates/5` (Recruiter)

---

## Features

### âœ… Implemented

1. **Role-Based Navigation**
   - Sidebar content changes based on user role
   - Contextual menu items for each section
   - Dynamic title based on current section

2. **Smart Routing**
   - All pages properly linked
   - No routing conflicts
   - Proper handling of dynamic routes

3. **Enhanced UX**
   - Breadcrumbs for navigation hierarchy
   - Active state highlighting in sidebar
   - Notification Credential on bell icon
   - User profile in header dropdown
   - Search functionality
   - Mobile-responsive sidebar (collapsible)

4. **Consistent Layouts**
   - All authenticated sections use same layout pattern
   - Sidebar + Header + Breadcrumbs + Content
   - Proper spacing and responsive design

---

## File Structure

```
app/
â”œâ”€â”€ (public)/              # Public pages (no sidebar)
â”‚   â”œâ”€â”€ landing/
â”‚   â”œâ”€â”€ features/
â”‚   â”œâ”€â”€ pricing/
â”‚   â”œâ”€â”€ login/
â”‚   â””â”€â”€ register/
â”‚
â”œâ”€â”€ (student)/             # Student portal
â”‚   â”œâ”€â”€ dashboard/
â”‚   â”œâ”€â”€ profile/
â”‚   â”œâ”€â”€ skills/
â”‚   â”œâ”€â”€ Credentials/
â”‚   â”œâ”€â”€ resume-analyzer/
â”‚   â””â”€â”€ career-insights/
â”‚
â”œâ”€â”€ (university)/[org]/    # University sections
â”‚   â”œâ”€â”€ admin/
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”œâ”€â”€ departments/
â”‚   â”‚   â”œâ”€â”€ members/
â”‚   â”‚   â””â”€â”€ settings/
â”‚   â”œâ”€â”€ faculty/
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”œâ”€â”€ courses/
â”‚   â”‚   â”œâ”€â”€ academic-records/
â”‚   â”‚   â””â”€â”€ capstones/
â”‚   â””â”€â”€ student/
â”‚       â”œâ”€â”€ dashboard/
â”‚       â”œâ”€â”€ records/
â”‚       â”œâ”€â”€ projects/
â”‚       â””â”€â”€ Credentials/
â”‚
â”œâ”€â”€ (recruiter)/[org]/     # Recruiter portal
â”‚   â”œâ”€â”€ dashboard/
â”‚   â”œâ”€â”€ search/
â”‚   â”œâ”€â”€ candidates/[id]/
â”‚   â”œâ”€â”€ jobs/
â”‚   â””â”€â”€ jobs/create/
â”‚
â”œâ”€â”€ (dashboard)/           # System admin
â”‚   â”œâ”€â”€ admin-dashboard/
â”‚   â”œâ”€â”€ users/
â”‚   â”‚   â””â”€â”€ [id]/
â”‚   â””â”€â”€ settings/
â”‚       â”œâ”€â”€ profile/
â”‚       â”œâ”€â”€ security/
â”‚       â”œâ”€â”€ communication/
â”‚       â””â”€â”€ permissions/
â”‚
â””â”€â”€ shared/                # Cross-section pages
    â”œâ”€â”€ notifications/
    â””â”€â”€ Credential-verification/[id]/

components/
â”œâ”€â”€ sidebar.tsx            # Dynamic sidebar with role detection
â”œâ”€â”€ header.tsx             # Enhanced header with notifications
â”œâ”€â”€ breadcrumbs.tsx        # Auto-generated breadcrumbs
â””â”€â”€ sidebar-provider.tsx   # Sidebar state management
```

---

## Testing Navigation

### Quick Test Routes

**Public:**
- http://localhost:3000/landing
- http://localhost:3000/features
- http://localhost:3000/pricing

**Student:**
- http://localhost:3000/dashboard
- http://localhost:3000/profile
- http://localhost:3000/skills

**University Admin:**
- http://localhost:3000/tech-university/admin/dashboard
- http://localhost:3000/tech-university/admin/departments

**Faculty:**
- http://localhost:3000/tech-university/faculty/dashboard
- http://localhost:3000/tech-university/faculty/courses

**Recruiter:**
- http://localhost:3000/techcorp/dashboard
- http://localhost:3000/techcorp/search

**System Admin:**
- http://localhost:3000/admin-dashboard
- http://localhost:3000/users

**Shared:**
- http://localhost:3000/shared/notifications

---

## Customization Guide

### Adding New Sidebar Item

Edit `components/sidebar.tsx`:

```tsx
// Add to appropriate nav array
const studentNavItems = [
  // ... existing items
  { name: "New Page", href: "/new-page", icon: NewIcon },
]
```

### Changing Sidebar Title

The sidebar title automatically updates based on section:
- Student: "Harbor Student"
- Admin: "Harbor Admin"
- University Admin: "University Admin"
- Faculty: "Faculty Portal"
- Recruiter: "Recruiter Portal"

### Adding Breadcrumb Exceptions

Edit `components/breadcrumbs.tsx` to hide on specific pages:

```tsx
if (pathname.startsWith("/your-page")) {
  return null
}
```

---

## Notes

1. **Route Groups**: Folders like `(student)` and `(dashboard)` are route groups - they don't affect URLs
2. **Dynamic Routes**: `[org]` and `[id]` are replaced with actual values in URLs
3. **Mobile**: Sidebar auto-collapses on mobile, accessible via hamburger menu
4. **Active States**: Current page is highlighted in sidebar
5. **Logout**: Always redirects to `/landing`

---

*Last updated: January 16, 2026*

