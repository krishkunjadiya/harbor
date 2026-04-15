# Harbor - Page Navigation

This document lists all available pages in the Harbor project for easy navigation and testing.

---

## ðŸŒ Public Pages (Unauthenticated)

These pages are accessible without login:

- **Landing Page**: [http://localhost:3000/landing](http://localhost:3000/landing)
- **Features**: [http://localhost:3000/features](http://localhost:3000/features)
- **Pricing**: [http://localhost:3000/pricing](http://localhost:3000/pricing)
- **Login**: [http://localhost:3000/login](http://localhost:3000/login)
- **Register**: [http://localhost:3000/register](http://localhost:3000/register)

---

## ðŸŽ“ Student Section

Student portal pages (requires student authentication):

- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Profile**: [http://localhost:3000/profile](http://localhost:3000/profile)
- **Edit Profile**: [http://localhost:3000/profile/edit](http://localhost:3000/profile/edit)
- **Skills**: [http://localhost:3000/skills](http://localhost:3000/skills)
- **Credentials**: [http://localhost:3000/credentials](http://localhost:3000/credentials)
- **Resume Analyzer**: [http://localhost:3000/resume-analyzer](http://localhost:3000/resume-analyzer)
- **Career Insights**: [http://localhost:3000/career-insights](http://localhost:3000/career-insights)

---

## ðŸ›ï¸ University Section

University portal pages (requires university authentication). Replace `{org}` with organization slug (e.g., `tech-university`):

### University Admin Portal
- **University Admin Dashboard**: [http://localhost:3000/tech-university/admin/dashboard](http://localhost:3000/tech-university/admin/dashboard)
- **Departments**: [http://localhost:3000/{org}/admin/departments](http://localhost:3000/tech-university/admin/departments)
- **Members**: [http://localhost:3000/{org}/admin/members](http://localhost:3000/tech-university/admin/members)
- **Settings**: [http://localhost:3000/{org}/admin/settings](http://localhost:3000/tech-university/admin/settings)

### Faculty Portal
- **Faculty Dashboard**: [http://localhost:3000/{org}/faculty/dashboard](http://localhost:3000/tech-university/faculty/dashboard)
- **Courses**: [http://localhost:3000/{org}/faculty/courses](http://localhost:3000/tech-university/faculty/courses)
- **Academic Records**: [http://localhost:3000/{org}/faculty/academic-records](http://localhost:3000/tech-university/faculty/academic-records)
- **Capstone Projects**: [http://localhost:3000/{org}/faculty/capstones](http://localhost:3000/tech-university/faculty/capstones)

### Student Portal (University)
- **Student Dashboard**: [http://localhost:3000/{org}/student/dashboard](http://localhost:3000/tech-university/student/dashboard)
- **Academic Records**: [http://localhost:3000/{org}/student/records](http://localhost:3000/tech-university/student/records)
- **Projects**: [http://localhost:3000/{org}/student/projects](http://localhost:3000/tech-university/student/projects)
- **Credentials**: [http://localhost:3000/{org}/student/credentials](http://localhost:3000/tech-university/student/credentials)

---

## ðŸ’¼ Recruiter Section

Recruiter portal pages (requires recruiter authentication). Replace `{org}` with organization slug (e.g., `techcorp`):

- **Dashboard**: [http://localhost:3000/{org}/dashboard](http://localhost:3000/techcorp/dashboard)
- **Search Candidates**: [http://localhost:3000/{org}/search](http://localhost:3000/techcorp/search)
- **Candidate Profile**: [http://localhost:3000/{org}/candidates/{id}](http://localhost:3000/techcorp/candidates/1)
  - Example IDs: 1, 2, 3, 4, 5, 6
- **Job Postings**: [http://localhost:3000/{org}/jobs](http://localhost:3000/techcorp/jobs)
- **Create Job**: [http://localhost:3000/{org}/jobs/create](http://localhost:3000/techcorp/jobs/create)

---

## ðŸ“Š System Admin Dashboard

System-wide admin dashboard pages (requires system admin authentication):

- **System Admin Dashboard**: [http://localhost:3000/admin-dashboard](http://localhost:3000/admin-dashboard)
- **Users**: [http://localhost:3000/users](http://localhost:3000/users)
- **User Details**: [http://localhost:3000/users/{id}](http://localhost:3000/users/1)
  - Example IDs: 1, 2, 3, 4

### Settings
- **Profile Settings**: [http://localhost:3000/settings/profile](http://localhost:3000/settings/profile)
- **Security Settings**: [http://localhost:3000/settings/security](http://localhost:3000/settings/security)
- **Communication Settings**: [http://localhost:3000/settings/communication](http://localhost:3000/settings/communication)
- **Permissions Settings**: [http://localhost:3000/settings/permissions](http://localhost:3000/settings/permissions)

---

## ðŸ”” Shared Pages

Pages accessible across different sections:

- **Notifications**: [http://localhost:3000/shared/notifications](http://localhost:3000/shared/notifications)
- **Credential Verification**: [http://localhost:3000/shared/credential-verification/{id}](http://localhost:3000/shared/credential-verification/Credential-AI-2025-12-4567)
  - Example Credential IDs: Credential-AI-2025-12-4567, Credential-FULL-STACK-2025-11-3456

---

## ðŸ“ Notes

### Testing Dynamic Routes

**University Pages**: Use any organization slug like:
- `tech-university`
- `innovation-institute`
- `global-university`

**Recruiter Pages**: Use any company slug like:
- `techcorp`
- `startupx`
- `google`

**User/Candidate IDs**: Use numeric IDs like:
- `1`, `2`, `3`, `4`, `5`, `6`

### Default Redirect

The root URL (`http://localhost:3000/`) redirects to `/landing`.

---

## ðŸŽ¨ Component Library

The project uses:
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Next.js 13+ App Router**

---

## ðŸ”— Quick Links for Development

### Most Visited Pages
1. [Landing](http://localhost:3000/landing) - Main entry point
2. [Student Dashboard](http://localhost:3000/dashboard) - Student portal
3. [Admin Dashboard](http://localhost:3000/admin-dashboard) - Admin portal
4. [Faculty Dashboard](http://localhost:3000/tech-university/faculty/dashboard) - Faculty portal
5. [Recruiter Dashboard](http://localhost:3000/techcorp/dashboard) - Recruiter portal

### Example User Flows

**Student Registration & Profile**:
1. [Register](http://localhost:3000/register) â†’ Sign up as student
2. [Dashboard](http://localhost:3000/dashboard) â†’ View overview
3. [Skills](http://localhost:3000/skills) â†’ Add skills
4. [Credentials](http://localhost:3000/credentials) â†’ View earned Credentials
5. [Profile](http://localhost:3000/profile) â†’ Complete profile

**Recruiter Job Posting**:
1. [Login](http://localhost:3000/login) â†’ Sign in as recruiter
2. [Dashboard](http://localhost:3000/techcorp/dashboard) â†’ View recruitment metrics
3. [Create Job](http://localhost:3000/techcorp/jobs/create) â†’ Post new position
4. [Search](http://localhost:3000/techcorp/search) â†’ Find candidates
5. [Candidate Profile](http://localhost:3000/techcorp/candidates/1) â†’ Review candidate

**Faculty Course Management**:
1. [Login](http://localhost:3000/login) â†’ Sign in as faculty
2. [Faculty Dashboard](http://localhost:3000/tech-university/faculty/dashboard) â†’ View teaching overview
3. [Courses](http://localhost:3000/tech-university/faculty/courses) â†’ Manage courses
4. [Academic Records](http://localhost:3000/tech-university/faculty/academic-records) â†’ Grade students
5. [Capstones](http://localhost:3000/tech-university/faculty/capstones) â†’ Review projects

---

*Last updated: January 16, 2026*

