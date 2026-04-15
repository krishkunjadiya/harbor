# Student Dashboard E2E and Functional Audit

Date: 2026-04-02
Project: Harbor
Scope: Complete student dashboard audit across global student routes and university-scoped student routes.

## Audit Coverage

This audit checked:
1. Non-working components
2. Non-working pages and routes
3. Non-working buttons and actions
4. Broken end-to-end student flows
5. State and API integration issues

Checked route groups:
1. app/(student)/student/*
2. app/(university)/[org]/student/*
3. shared components and server actions used by student pages

Validation method:
1. File-by-file code inspection for page, component, hook, and action wiring
2. Flow tracing from UI trigger to backend action and persisted data
3. Build validation (npm run build) for runtime/compile readiness

## Build and Test Readiness

1. Build status: failed
2. Build blocker is unrelated to student pages:
   - app/(university)/[org]/faculty/courses/[courseId]/assignments/page.tsx:19
   - Type error: Property org does not exist on type Record<string, string | string[]> | null

Impact:
1. Student findings below are validated by source inspection.
2. Full production build pass for the whole repo is currently blocked by the unrelated faculty error.

## Issues List

### 1) Save or Bookmark Jobs Is Not Persisted
- Type: Flow
- File path:
  - app/(student)/student/jobs/page.tsx
  - app/(student)/student/jobs/jobs-client.tsx
  - app/(student)/student/jobs/[id]/job-detail-client.tsx
- Description of the problem:
  - Jobs page passes savedCount={0}.
  - Bookmark state is kept only in local component state.
  - Bookmark status resets after refresh or navigation.
- Expected behavior:
  - Saved jobs should be persisted per student and restored on load.
- Suggested fix:
  - Add student_saved_jobs persistence table and server actions for list/save/unsave.
  - Hydrate saved state from backend in jobs list and job detail pages.

### 2) University Student Assignments Flow Is Broken by Data Contract Mismatch
- Type: Flow
- File path:
  - app/(university)/[org]/student/assignments/page.tsx
  - app/(university)/[org]/student/assignments/student-assignments-client.tsx
- Description of the problem:
  - Server transforms assignments with fields like due_date, course_name, course_code.
  - Client expects different fields: dueDate, course, type, maxPoints.
  - Submit Assignment button is rendered but has no submit handler.
- Expected behavior:
  - Assignments should display correct data fields and support real submissions.
- Suggested fix:
  - Align response contract between server page and client component.
  - Wire submit button to assignment_submissions create action with upload and status updates.

### 3) University Student Enrollment Enroll or Drop Actions Are UI-Only
- Type: Flow
- File path:
  - app/(university)/[org]/student/enrollment/student-enrollment-client.tsx
- Description of the problem:
  - handleEnroll and handleDrop only move items between local arrays.
  - No backend enrollment mutation is called.
- Expected behavior:
  - Enroll and drop must persist to course_enrollments and survive refresh.
- Suggested fix:
  - Add server actions for enroll/drop and re-fetch enrollment data after success.

### 4) University Student Credentials Route Uses Wrong Role Guard and Wrong Intent
- Type: Page
- File path:
  - app/(university)/[org]/student/credentials/page.tsx
- Description of the problem:
  - Guard requires profile.user_type to be university, not student.
  - Page copy and behavior are admin-like: Manage and award Credentials to students.
- Expected behavior:
  - Student Credential page should show the logged-in student's own Credentials and achievements.
- Suggested fix:
  - Enforce student access and switch data/query/rendering to student-owned Credentials.

### 5) Student Dashboard Application Count Is Underreported
- Type: State/API
- File path:
  - lib/actions/database.ts
- Description of the problem:
  - getStudentDashboard fetches only 10 job applications but uses that limited array length as applications_count.
- Expected behavior:
  - applications_count should represent full total, independent of recent list limit.
- Suggested fix:
  - Keep recent list limit for display, and compute total count via exact count query.

### 6) Jobs Apply Dialog Claims Resume Is Included but Backend Does Not Attach Resume
- Type: Flow
- File path:
  - app/(student)/student/jobs/jobs-client.tsx
  - lib/actions/mutations.ts
- Description of the problem:
  - UI says profile and resume are automatically included.
  - applyToJob insert payload stores only student_id, job_id, cover_letter, status.
- Expected behavior:
  - Either include resume_url in application payload or avoid claiming it is included.
- Suggested fix:
  - Add resume_url resolution from student profile during apply action, or revise UI text.

### 7) Skills Are Split Across Two Data Models
- Type: Flow
- File path:
  - app/(student)/student/profile/page.tsx
  - app/(student)/student/profile/edit/page.tsx
  - app/(student)/student/skills/skills-client.tsx
- Description of the problem:
  - Profile view reads student_taxonomy_skills.
  - Profile edit reads/writes user_skills.
  - Dedicated skills page reads/writes student_taxonomy_skills.
- Expected behavior:
  - One canonical skills model should drive profile view, edit, and skills page.
- Suggested fix:
  - Standardize all student skill flows on taxonomy skills or fully migrate to one model.

### 8) Global Student Activity Feed Is Placeholder-Only
- Type: Page
- File path:
  - app/(student)/student/activity-feed/page.tsx
  - app/(university)/[org]/student/activity-feed/page.tsx
- Description of the problem:
  - Global student page shows static placeholder text and no activity query.
  - University-scoped student page already uses getUserActivities and ActivityFeedClient.
- Expected behavior:
  - Global student feed should show real activity data like the university-scoped route.
- Suggested fix:
  - Reuse real activity feed implementation in the global student route.

### 9) Help and Support Buttons Are Not Wired to Real Actions
- Type: Button
- File path:
  - app/(student)/student/help/page.tsx
  - app/(dashboard)/help/help-support-client.tsx
- Description of the problem:
  - Student help page buttons render labels but no route/action handlers.
  - Shared support client uses alert for ticket submission and static channel buttons.
- Expected behavior:
  - Buttons should navigate to docs/faqs/support actions, and support ticket should persist.
- Suggested fix:
  - Wire buttons to routes/actions and replace alert-based ticket submission with backend flow.

### 10) Interview Prep Is Static Mock Data with Non-functional Action Buttons
- Type: Component
- File path:
  - app/(student)/student/interview-prep/interview-prep-client.tsx
- Description of the problem:
  - practiceCategories, recentChallenges, and interviewTips are hardcoded constants.
  - Practice Now and Schedule buttons do not trigger any real flow.
- Expected behavior:
  - Interview prep should load dynamic data and actions should open real practice or scheduling workflows.
- Suggested fix:
  - Integrate with actual challenge and scheduling backends; wire button handlers.

### 11) Profile Avatar Upload Button Is Not Connected to Upload or Save
- Type: Button
- File path:
  - app/(student)/student/profile/edit/page.tsx
- Description of the problem:
  - Upload New Photo button has no handler.
  - avatarUrl exists in state but is not persisted in update payload.
- Expected behavior:
  - Selecting an avatar should upload and save avatar_url to profile.
- Suggested fix:
  - Connect uploadAvatar action and include avatar_url in updateUserProfile call.

### 12) Share Profile URL Points to Non-existent Route
- Type: Flow
- File path:
  - components/share-profile-button.tsx
  - app/profile (missing)
- Description of the problem:
  - Share URL is generated as /profile, but this route does not exist in app.
- Expected behavior:
  - Share link should point to a valid public student profile route.
- Suggested fix:
  - Generate canonical public profile path or add the missing route.

### 13) Notifications UI Maps Type Keys Inconsistently with Stored Schema
- Type: Component
- File path:
  - app/shared/notifications/notifications-client.tsx
  - lib/actions/mutations.ts
  - sql/database-schema.sql
- Description of the problem:
  - UI color mapping checks for Credential_earned and application_update as notification.type.
  - Mutation stores normalized type values: info, success, warning, error.
  - Database schema constrains notification.type to those normalized values.
- Expected behavior:
  - UI styling should map by stored type/category values.
- Suggested fix:
  - Update getNotificationColor to map by schema type/category.

### 14) Student Route Role Guards Are Inconsistent
- Type: Page
- File path:
  - app/(student)/layout.tsx
  - app/(student)/student/jobs/page.tsx
  - app/(student)/student/profile/page.tsx
  - app/(student)/student/applications/page.tsx
  - app/(student)/student/credentials/page.tsx
- Description of the problem:
  - Layout does not enforce role.
  - Some pages only check logged-in profile, while others enforce profile.user_type student.
- Expected behavior:
  - Student routes should enforce one consistent student-role guard strategy.
- Suggested fix:
  - Add shared role gate utility and apply it uniformly across student pages.

### 15) University Student Records Download Transcript Is Placeholder
- Type: Button
- File path:
  - app/(university)/[org]/student/records/page.tsx
- Description of the problem:
  - Download Transcript button triggers alert("Transcript downloading...") only.
- Expected behavior:
  - Download should generate or retrieve transcript file.
- Suggested fix:
  - Connect to transcript export endpoint or storage download action.

## Highlighted Critical Broken Flows

These flows block core student functionality and should be prioritized:

1. Saved jobs flow is not real persistence.
2. University student assignments flow is broken (data mapping plus no submit action).
3. University student enrollment actions do not persist.
4. University student Credentials route is role-mismatched and not student-facing.
5. Student dashboard application count is inaccurate after more than 10 applications.

## Student Core Flow Health Snapshot

1. Applying to jobs or internships: Partially working (application insert works, but saved jobs and resume inclusion expectations are inconsistent).
2. Saving or bookmarking jobs: Broken.
3. Viewing applications and statuses: Working in global student routes.
4. Profile creation and updates: Partially working (avatar upload and skills model consistency gaps).
5. Resume upload and usage: Upload and analysis flow works, but depends on Python worker uptime.

## Recommended Fix Plan

1. Implement student saved-jobs persistence end to end.
2. Fix university student assignments data contract and wire submit action.
3. Implement persistent enroll/drop actions for university student enrollment.
4. Correct university student Credentials route role and purpose.
5. Fix applications_count query logic in getStudentDashboard.
6. Unify skills model across profile and skills pages.
7. Wire help, interview prep, avatar upload, share, and transcript download actions.
8. Normalize notifications UI mapping to schema-backed fields.
9. Apply consistent student role guards across all student pages.


