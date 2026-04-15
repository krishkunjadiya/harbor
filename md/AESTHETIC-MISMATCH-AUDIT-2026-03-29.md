# Harbor Aesthetic Mismatch Audit (2026-03-29)

## Implementation Status (2026-03-30)
- Completed: theme-normalization pass applied across Harbor `app/` and `components/` surfaces.
- Completed: semantic `info` and `warning` tokens added in `app/globals.css`.
- Completed: high-impact pages refactored (analytics charts, credentials, Credentials, notifications, reports, chart axis styling).
- Residual intentional exceptions:
   - Google logo brand SVG fills in `app/(public)/register/page.tsx`.
   - Default value for Credential color picker in `app/(university)/[org]/admin/credentials/Credential-management-client.tsx` (required for `input[type="color"]`).

## Baseline Aesthetic (Current Project)
- Neutral token-based palette from CSS variables (`--background`, `--foreground`, `--primary`, `--muted`, etc.).
- Typography baseline uses `IBM Plex Sans Variable`.
- UI is intended to be built via semantic shadcn variants and theme tokens, not per-page ad-hoc color palettes.

## High-Impact Mismatches (Priority)
1. Hardcoded hex and rainbow chart palettes in recruiter analytics.
   - `app/(recruiter)/[org]/analytics/analytics-dashboard-client.tsx`
   - Uses `COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']` and chart `stroke/fill` hex values.
   - Uses hardcoded progress bars (`bg-yellow-600`, `bg-blue-600`, `bg-green-600`, `bg-purple-600`) over `bg-gray-200`.

2. Credential cards using direct status colors and inline hex style.
   - `app/(student)/student/credentials/credentials-client.tsx`
   - `borderLeftColor` inline style with `#16a34a` and `#eab308`.
   - Credentials use direct color utilities (`bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`).

3. University student credentials card header uses loud gradient not tied to tokens.
   - `app/(university)/[org]/student/credentials/student-credentials-client.tsx`
   - `bg-gradient-to-r from-blue-500 to-purple-500`

4. Credential pages use many categorical neon gradients (visual drift from neutral UI shell).
   - `app/(student)/student/credentials/page.tsx`
   - `app/(university)/[org]/student/credentials/page.tsx`

5. Notifications page maps notification types to raw hue classes.
   - `app/shared/notifications/notifications-client.tsx`
   - `bg-green-500/10`, `bg-blue-500/10`, `bg-purple-500/10`, `bg-yellow-500/10`, etc.

6. Reports cards encode type colors as explicit hue classes.
   - `app/(recruiter)/[org]/reports/reports-client.tsx`
   - `color: 'bg-blue-100 text-blue-700'`, `bg-green-100`, `bg-purple-100`, `bg-yellow-100`.

## Additional Drift Patterns
- Repeated status chips with direct hue classes across recruiter/student/university pages.
- Modal overlays use mixed darkness values (`bg-black/40` vs themed dialog overlays in UI primitives).
- Chart axes in shared chart component include hardcoded `#888888` instead of tokenized foreground/muted color.

## Exhaustive File Inventory (Contains Off-Theme Color/Gradient/Hex Usage)
- app/(dashboard)/activity-feed/activity-feed-client.tsx
- app/(dashboard)/help/help-support-client.tsx
- app/(dashboard)/users/[id]/page.tsx
- app/(dashboard)/users/users-table.tsx
- app/(public)/register/page.tsx
- app/(recruiter)/[org]/analytics/analytics-dashboard-client.tsx
- app/(recruiter)/[org]/applications/applications-client.tsx
- app/(recruiter)/[org]/candidates/@modal/(.)[id]/page.tsx
- app/(recruiter)/[org]/candidates/[id]/page.tsx
- app/(recruiter)/[org]/dashboard/application-status-actions.tsx
- app/(recruiter)/[org]/dashboard/dashboard-applications.tsx
- app/(recruiter)/[org]/dashboard/page.tsx
- app/(recruiter)/[org]/interviews/interview-scheduling-client.tsx
- app/(recruiter)/[org]/jobs/create/page.tsx
- app/(recruiter)/[org]/jobs/jobs-client.tsx
- app/(recruiter)/[org]/reports/reports-client.tsx
- app/(recruiter)/[org]/saved-candidates/saved-candidates-client.tsx
- app/(recruiter)/[org]/search/search-client.tsx
- app/(recruiter)/[org]/team/team-collaboration-client.tsx
- app/(student)/student/applications/applications-client.tsx
- app/(student)/student/credentials/page.tsx
- app/(student)/student/career-insights/page.tsx
- app/(student)/student/credentials/credentials-client.tsx
- app/(student)/student/dashboard/page.tsx
- app/(student)/student/interview-prep/interview-prep-client.tsx
- app/(student)/student/jobs/[id]/job-detail-client.tsx
- app/(student)/student/jobs/jobs-client.tsx
- app/(student)/student/learning-resources/learning-resources-client.tsx
- app/(student)/student/profile/page.tsx
- app/(student)/student/resume-analyzer/page.tsx
- app/(university)/[org]/admin/credentials/Credential-management-client.tsx
- app/(university)/[org]/admin/dashboard/page.tsx
- app/(university)/[org]/admin/departments/departments-client.tsx
- app/(university)/[org]/admin/faculty/faculty-management-client.tsx
- app/(university)/[org]/admin/members/members-client.tsx
- app/(university)/[org]/admin/students/student-management-client.tsx
- app/(university)/[org]/admin/test-db/test-db-client.tsx
- app/(university)/[org]/faculty/academic-records/page.tsx
- app/(university)/[org]/faculty/assignments/assignments-client.tsx
- app/(university)/[org]/faculty/capstones/capstones-client.tsx
- app/(university)/[org]/faculty/courses/[courseId]/materials/page.tsx
- app/(university)/[org]/faculty/courses/[courseId]/students/page.tsx
- app/(university)/[org]/faculty/courses/page.tsx
- app/(university)/[org]/faculty/dashboard/page.tsx
- app/(university)/[org]/faculty/enrollments/course-enrollments-client.tsx
- app/(university)/[org]/faculty/profile/page.tsx
- app/(university)/[org]/faculty/settings/profile/page.tsx
- app/(university)/[org]/student/assignments/student-assignments-client.tsx
- app/(university)/[org]/student/credentials/page.tsx
- app/(university)/[org]/student/credentials/student-credentials-client.tsx
- app/(university)/[org]/student/dashboard/page.tsx
- app/(university)/[org]/student/enrollment/student-enrollment-client.tsx
- app/(university)/[org]/student/projects/page.tsx
- app/(university)/[org]/student/records/page.tsx
- app/shared/credential-verification/[id]/page.tsx
- app/shared/notifications/notifications-client.tsx
- components/credential-upload.tsx
- components/dashboard-chart.tsx
- components/file-upload.tsx
- components/learning-resources-manager.tsx
- components/recent-transactions.tsx
- components/share-profile-button.tsx
- components/user-transactions.tsx

## Recommended Normalization Rules
- Replace direct hue classes for semantic states with mapped token classes (`success`, `warning`, `destructive`, `info`) centralized in one utility.
- Replace all chart hex values with CSS variable-driven colors.
- Replace gradient-heavy category cards with tokenized surfaces + icon accents.
- Keep brand-specific colors only where truly required (example: Google logo icon in auth/register).

