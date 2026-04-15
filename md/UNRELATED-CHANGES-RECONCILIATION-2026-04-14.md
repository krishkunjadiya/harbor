# Unrelated Changes Reconciliation
Date: 2026-04-14

## Current Git State Constraint
Git currently reports the whole workspace as untracked (top-level entries like app/, components/, lib/, md/, etc.).
Because of that, Git cannot reliably distinguish "my recent UX fixes" from older local changes at file-history level.

## Confirmed UX Fixes Applied In This Session
These are intentional and validated (no errors in edited files):
- Removed duplicate route file: app/(recruiter)/[org]/jobs/page-new.tsx
- Removed duplicate route file: app/(university)/[org]/admin/departments/page-new.tsx
- Removed orphan component: components/user-transactions.tsx
- Removed orphan component: components/breadcrumbs.tsx
- Updated recruiter navigation and footer entries: components/sidebar.tsx
- Updated shortlist wording for recruiter action: components/save-candidate-button.tsx

## Focused Inventory Of Likely Unrelated / Risky Changes

### A) Backup and snapshot artifacts (high confidence unrelated)
- app/(student)/student/profile/edit/page-DATABASE.tsx.bak (removed)
- app/(student)/student/profile/edit/page-BACKUP.tsx.bak (removed)
- app/(student)/student/profile/page-old-backup.tsx (removed)
- reactive_resume/src/routes/dashboard/-components/sidebar.backup.tsx (removed)
- reactive_resume/src/routes/auth/verify-2fa-backup.tsx (renamed/migrated)

Why this matters:
- Backup files create parallel implementations and future merge confusion.
- Some contain obsolete flow/state assumptions and can reintroduce inconsistency.

Migration note:
- Active 2FA recovery route was renamed to `reactive_resume/src/routes/auth/verify-2fa-recovery.tsx`.
- References were updated in `verify-2fa.tsx` and `reactive_resume/src/routeTree.gen.ts`.
- Old `verify-2fa-backup.tsx` file was removed after migration.

### B) Test-only admin routes (likely non-production)
- app/(university)/[org]/admin/test-db/page.tsx (removed)
- app/(university)/[org]/admin/test-db/test-db-client.tsx (removed)

Why this matters:
- Exposes internal diagnostics in app route tree.
- Risks accidental user access and unclear product boundaries.

### C) Alternate database implementation variant
- app/(university)/[org]/admin/departments/departments-client-DATABASE.tsx (removed)

Why this matters:
- Competes with active departments client implementation.
- Violates single source of truth for department-management UI behavior.

### D) Parallel Activity Feed surface still present in routes
- app/(dashboard)/activity-feed/page.tsx (redirects to /notifications)
- app/(student)/student/activity-feed/page.tsx (redirects to /student/notifications)
- app/(recruiter)/[org]/activity-feed/page.tsx (redirects to /{org}/notifications)
- app/(university)/[org]/admin/activity-feed/page.tsx (redirects to /{org}/admin/notifications)
- app/(university)/[org]/faculty/activity-feed/page.tsx (redirects to /{org}/faculty/notifications)
- app/(university)/[org]/student/activity-feed/page.tsx (redirects to /{org}/student/notifications)

Why this matters:
- Sidebar was simplified to reduce duplication, but route-level duplication remains.
- Users may still access duplicate event destinations directly by URL.

## Safe Reconciliation Plan
1. Keep confirmed UX fixes listed above.
2. Remove or archive backup artifacts in section A.
3. Remove or isolate test-db route from production tree (section B).
4. Remove alternate departments implementation variant in section C.
5. Consolidate Activity Feed routes by redirecting them to Notifications (section D).
6. Re-run type/error checks after each batch.

## Suggested Cleanup Order (Low Risk -> Higher Impact)
1. Delete backup artifacts (.bak / backup files).
2. Delete test-db route files.
3. Delete departments-client-DATABASE.tsx.
4. Convert activity-feed pages to redirects.

## Execution Status
Cleanup plan executed for sections A, B, C, and D with post-change error checks passing on touched files.
