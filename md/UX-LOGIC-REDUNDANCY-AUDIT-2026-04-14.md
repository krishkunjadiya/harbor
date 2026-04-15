# Harbor Human-Centered UX Logic Review
Date: 2026-04-14

## Objective
Evaluate product logic and user experience quality across the codebase, focusing on redundancy, navigation clarity, single-source-of-truth violations, and confusing flow design.

## Review Lens
- Human-centered design: reduce cognitive load, minimize unnecessary choices/clicks, and keep mental models clear.
- Product logic over code correctness: this report does not assess syntax/runtime defects.
- Scope: student, recruiter, university, shared, and admin surfaces.

## High Severity

### H1) Duplicate route implementations via `page-new.tsx`
- Problem: Parallel page variants exist beside active pages.
- Why this is a UX/product flaw: Duplicate implementations create contradictory sources of behavior and increase the chance that user-facing flows diverge silently over time.
- Evidence:
  - `app/(recruiter)/[org]/jobs/page-new.tsx`
  - `app/(recruiter)/[org]/jobs/page.tsx`
  - `app/(university)/[org]/admin/departments/page-new.tsx`
  - `app/(university)/[org]/admin/departments/page.tsx`
- Recommendation: Remove `page-new.tsx` files. If alternates are needed, use feature flags or controlled experiments.

### H2) Recruiter information architecture duplicates core candidate workflows
- Problem: `Candidates` and `Applications` are exposed as separate destinations with overlapping data intent.
- Why this is a UX/product flaw: Users cannot reliably predict which page contains the canonical state of candidate progress.
- Evidence:
  - `app/(recruiter)/[org]/candidates/page.tsx`
  - `app/(recruiter)/[org]/applications/page.tsx`
  - `components/sidebar.tsx`
- Recommendation: Consolidate into one pipeline surface with tabs/filters (`All`, `Applied`, `Shortlisted`, `Interview`).

### H3) Redundant recruiter actions in navigation (destination + action at same level)
- Problem: Sidebar contains both `Job Postings` and `Create Job` as peer nav items.
- Why this is a UX/product flaw: This violates progressive disclosure and clutters global navigation with local actions.
- Evidence:
  - `components/sidebar.tsx`
- Recommendation: Keep `Job Postings` in sidebar; move `Create Job` to a primary CTA inside job-related pages.

### H4) Notifications vs Activity Feed are split despite overlapping user intent
- Problem: Both routes exist across roles even when behavior appears similar/placeholder.
- Why this is a UX/product flaw: Users must check multiple places for timeline-like events, increasing confusion and missed information.
- Evidence:
  - `app/(student)/student/notifications/page.tsx`
  - `app/(student)/student/activity-feed/page.tsx`
  - `app/(dashboard)/notifications/page.tsx`
  - `app/(dashboard)/activity-feed/page.tsx`
  - `app/shared/notifications/page.tsx`
- Recommendation: One event hub with clear partitioning (system alerts vs user activity) under a single route.

### H5) Single source of truth is broken for notifications routes
- Problem: Shared notifications implementation exists, yet role-specific pages also expose notifications independently.
- Why this is a UX/product flaw: Multiple route entry points for same concept increase inconsistency risk and make support/documentation harder.
- Evidence:
  - `app/shared/notifications/page.tsx`
  - role-specific notifications pages under `app/(student)`, `app/(recruiter)`, `app/(university)`
- Recommendation: Define one canonical route/component contract; make role routes thin redirects.

## Medium Severity

### M1) Student profile overlaps with dedicated credentials/skills pages
- Problem: Profile displays data that is also managed in dedicated pages.
- Why this is a UX/product flaw: Users are left guessing where edits should happen and which screen is authoritative.
- Evidence:
  - `app/(student)/student/profile/page.tsx`
  - `app/(student)/student/skills/page.tsx`
  - `app/(student)/student/credentials/page.tsx`
- Recommendation: Profile becomes summary-only; editing lives only in dedicated domain pages.

### M2) Dashboard route naming is inconsistent across roles
- Problem: Mix of `/dashboard`, `/admin-dashboard`, and org-scoped dashboard patterns.
- Why this is a UX/product flaw: Inconsistent URL semantics increase orientation cost and onboarding friction.
- Evidence:
  - `app/dashboard/page.tsx`
  - `lib/navigation/shell.ts`
- Recommendation: Standardize dashboard route grammar and role mapping.

### M3) Interview prep flow is over-nested
- Problem: Intermediate nesting adds route depth without user value.
- Why this is a UX/product flaw: Adds extra navigation steps and weakens wayfinding.
- Evidence:
  - `app/(student)/student/interview-prep/page.tsx`
  - `app/(student)/student/interview-prep/interview/page.tsx`
  - nested interview prep routes under `app/(student)/student/interview-prep/interview/*`
- Recommendation: Flatten to direct task routes under interview prep.

### M4) Candidate lifecycle labels are ambiguous (`Saved` vs `Applied`)
- Problem: Save/bookmark behavior coexists with applications without clear state model.
- Why this is a UX/product flaw: Users cannot infer whether `Saved` means bookmark, shortlist stage, or application status.
- Evidence:
  - `components/save-candidate-button.tsx`
  - recruiter candidates/applications pages
- Recommendation: Rename to `Shortlist`, show as explicit pipeline stage, and keep stage definitions visible.

### M5) Recruiter navigation lacks conceptual grouping
- Problem: Candidate-related surfaces appear as flat peers in sidebar.
- Why this is a UX/product flaw: Related tasks are fragmented, making workflow progression less intuitive.
- Evidence:
  - `components/sidebar.tsx`
- Recommendation: Group by lifecycle (`Jobs`, `Candidates`, `Interviews`, `Reports`) with sub-navigation/filters.

### M6) Role ownership boundaries are not explicit in university flows
- Problem: Similar sections across admin/faculty/student blur responsibility.
- Why this is a UX/product flaw: Ambiguous ownership causes decision latency and inconsistent operational behavior.
- Evidence:
  - route groups under `app/(university)`
  - `components/sidebar.tsx`
- Recommendation: Clarify ownership in labels, permissions, and action placement (global vs course-level vs student view).

### M7) Settings IA mixes mature and placeholder destinations
- Problem: Some settings screens are robust while others are partial but equally surfaced.
- Why this is a UX/product flaw: Users encounter dead-ends and lose trust in settings completeness.
- Evidence:
  - `components/sidebar.tsx`
  - `components/settings/profile-settings-page.tsx`
  - `components/settings/password-settings-page.tsx`
- Recommendation: Hide unfinished entries or mark as coming soon with clear status and expected scope.

## Low Severity

### L1) Help experience is duplicated by role with low differentiation
- Problem: Multiple help pages exist with similar structure.
- Why this is a UX/product flaw: Duplicate documentation surfaces increase maintenance burden with little user benefit.
- Evidence:
  - `app/(student)/student/help/page.tsx`
  - role help pages in recruiter/university/admin groups
- Recommendation: Consolidate to shared help with role-aware sections.

### L2) Breadcrumb infrastructure appears unused
- Problem: Breadcrumb component exists without clear integration path.
- Why this is a UX/product flaw: Unused navigation primitives create design drift and implementation ambiguity.
- Evidence:
  - `components/breadcrumbs.tsx`
  - `components/header.tsx`
- Recommendation: Either integrate globally or remove until needed.

### L3) Overlapping/orphan dashboard widgets
- Problem: Similar dashboard widgets exist, including likely orphaned usage.
- Why this is a UX/product flaw: Competing components can produce inconsistent visual language and duplicate effort.
- Evidence:
  - `components/user-transactions.tsx`
  - `components/recent-transactions.tsx`
  - `components/dashboard-chart.tsx`
- Recommendation: Define one canonical dashboard widget set and archive/delete the rest.

### L4) Storage action surface is over-specialized
- Problem: Multiple upload wrappers differ mainly by destination.
- Why this is a UX/product flaw: Not user-facing directly, but architectural duplication increases long-term UX inconsistency risk by scattering behavior.
- Evidence:
  - `lib/actions/storage.ts`
- Recommendation: Consolidate to one typed upload API with destination config.

### L5) Resume tool naming could be more intention-revealing
- Problem: `Resume Analyzer` and `Resume Builder` labels can still be misread by first-time users.
- Why this is a UX/product flaw: Similar labels for distinct outcomes slow task selection.
- Evidence:
  - `app/(student)/student/resume-analyzer/page.tsx`
  - `app/(student)/student/resume-builder/page.tsx`
  - `components/sidebar.tsx`
- Recommendation: Add short helper text or subtitles to clarify expected outcomes.

## Consolidation Opportunities (Single Source of Truth)
1. Notifications: one canonical route + role-aware rendering.
2. Candidate lifecycle: one pipeline surface instead of split candidates/applications destinations.
3. Student profile domain data: profile as summary, domain pages as canonical editors.
4. Dashboard route grammar: one consistent URL model across roles.

## Recommended Execution Order
1. Remove duplicate/parallel routes and nav action duplication (H1-H3).
2. Unify notifications/event architecture and canonicalize routes (H4-H5).
3. Consolidate candidate lifecycle and clarify state language (`Shortlist`, `Applied`, `Interview`) (H2, M4, M5).
4. Simplify student and interview-prep flow architecture (M1, M3).
5. Clean remaining low-severity redundancy (L1-L5).

## Success Criteria
- Users can complete major tasks with one obvious path.
- Each concept has one canonical place to view/edit state.
- Global navigation contains destinations, while local pages own task actions.
- Role boundaries are clear in labels, permissions, and page responsibilities.

## 2026-04-14 Progress Update (Implemented)
- Removed all `activity-feed` route stubs and repointed navigation/script references to `notifications`.
- Consolidated recruiter primary lifecycle navigation to one canonical route: `/{org}/applications` (`Candidate Pipeline`).
- Converted `/{org}/candidates` list surface into a redirect to `/{org}/applications` while preserving query intent.
- Updated recruiter-facing pipeline labels in applications/dashboard surfaces from `Applications` to `Candidate Pipeline` where they represented the same destination.
- Repointed legacy candidate modal close/fallback navigation to `/{org}/applications`.

## 2026-04-14 Decision: Saved Candidates Surface
- Decision: Keep `/{org}/saved-candidates` as a separate surface for now.
- Rationale: `saved-candidates` models recruiter bookmarks/prospects, while `applications` models submitted job applications and status progression.
- Follow-up: If product wants full merge, backend needs a unified candidate lifecycle model that explicitly maps bookmark state into pipeline stages.

## 2026-04-14 Progress Update (Batch 2)
- Normalized recruiter shortlist language on the dedicated shortlisted surface:
  - `Saved Candidates` -> `Shortlisted Candidates`
  - `Total Saved` -> `Total Shortlisted`
  - Empty/error/toast copy updated from `saved` terminology to `shortlist` terminology.
- Verification checks:
  - No `page-new.tsx` duplicate route variants currently exist in `app/**` (H1 currently not present in code).
  - Recruiter sidebar no longer has a peer `Create Job` global nav item (H3 currently addressed in code).

## 2026-04-14 Progress Update (Batch 3)
- Improved recruiter sidebar information architecture order to group lifecycle actions together:
  - `Search Candidates` -> `Candidate Pipeline` -> `Shortlisted` -> `Interviews`
- This reduces scanning friction by keeping sourcing and progression steps adjacent.

## 2026-04-14 Progress Update (Batch 4)
- Consolidated notifications page rendering into one canonical shared shell component:
  - Added shared notifications shell: `app/shared/notifications/notifications-page-shell.tsx`
  - Converted all notifications routes to thin wrappers around the shared shell.
- Standardized auth access pattern in university faculty notifications page by using route-context helper instead of bespoke Supabase auth checks.
- Result: H5 is now addressed at the component-contract level (single source for notifications page structure/behavior).

## 2026-04-14 Progress Update (Batch 5)
- Flattened student interview-prep module routes by introducing direct task URLs under `/{student}/interview-prep/*`.
- Updated module launcher links to direct routes:
  - `/student/interview-prep/mock-interview`
  - `/student/interview-prep/question-bank`
  - `/student/interview-prep/evaluator`
  - `/student/interview-prep/performance`
  - `/student/interview-prep/prep-cards`
  - `/student/interview-prep/resources`
- Added backward-compatible redirects from legacy nested paths under `/student/interview-prep/interview/*` to the new direct routes.
- Result: M3 is addressed with reduced route depth and preserved old-link compatibility.

## 2026-04-14 Progress Update (Batch 6)
- Converted student profile to a summary-first surface to avoid overlap with dedicated editing pages:
  - Education tab now shows summary + credentials count, with explicit `Manage Credentials` action.
  - Skills tab now shows preview/count and links users to `Skills` for full management.
  - Removed full credentials listing from profile.
- Result: M1 is addressed by making profile an overview while domain pages remain the canonical editors.

  ## 2026-04-14 Progress Update (Batch 7)
  - Standardized dashboard entrypoint semantics for admin navigation:
    - Admin sidebar `Dashboard` now points to `/dashboard`.
    - Shell home href for admin now resolves to `/dashboard`.
  - Result: M2 is partially addressed with a consistent entry route model across portals, while legacy `/admin-dashboard` remains supported.

  ## 2026-04-14 Progress Update (Batch 8)
  - Clarified student resume tool intent in sidebar labels:
    - `Resume Analyzer` -> `Resume Review (AI)`
    - `Resume Builder` -> `Resume Builder (Editor)`
  - Result: L5 is addressed by making first-time task selection more intention-revealing.

  ## 2026-04-14 Progress Update (Batch 9)
  - Consolidated admin dashboard widget implementation into one canonical component:
    - Added `components/admin-dashboard-widgets.tsx` as the single admin dashboard widget module.
    - Updated admin dashboard page to consume the canonical widget component.
    - Removed fragmented legacy components: `components/dashboard-chart.tsx` and `components/recent-transactions.tsx`.
  - Result: L3 is addressed by eliminating split/orphan-prone widget surfaces for admin dashboard.

  ## 2026-04-14 Progress Update (Batch 10)
  - Completed admin dashboard route canonicalization:
    - `/dashboard` now renders the admin dashboard experience for admin users with full admin shell.
    - Legacy `/admin-dashboard` now acts as a compatibility redirect to `/dashboard`.
  - Result: M2 follow-up is addressed with a single canonical admin dashboard route.

  ## 2026-04-14 Progress Update (Batch 11)
  - Consolidated student help surface onto the shared help support client to reduce role-duplicated help implementations.
  - Improved university navigation role-ownership clarity with explicit role-centric labels:
    - `Admin Dashboard`, `Faculty Dashboard`, `Student Dashboard`
    - `University Members`, `Student Advising`
  - Result: L1 and M6 are addressed with clearer ownership and less duplicated help logic.

  ## 2026-04-14 Verification Notes
  - L2 appears already resolved in current codebase (`components/breadcrumbs.tsx` is no longer present).
  - M7 appears stale against current implementation: settings routes exist with implemented pages across roles, with no obvious "coming soon" placeholders in settings surfaces.
  - L4 appears already addressed in current code: `lib/actions/storage.ts` uses a single typed `uploadFile` utility with thin wrappers (`uploadAvatar`, `uploadResume`, `uploadCredentialDocument`).
  - L3 now addressed with canonical widget consolidation under `components/admin-dashboard-widgets.tsx`.
  - H1 verification: no `app/**/page-new.tsx` route variants remain.
  - H4 verification: no `app/**/activity-feed/page.tsx` routes remain.

## Remaining High/Medium Problems To Continue
- Optional follow-up: If product wants strict route-level canonicalization, convert non-primary notifications paths into explicit redirects to a designated canonical URL.
- All listed H/M/L problems in this audit are now either resolved in code or verified obsolete against current implementation.
