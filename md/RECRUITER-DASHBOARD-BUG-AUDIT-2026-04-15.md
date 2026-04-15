# Recruiter Dashboard Bug Audit

Date: 2026-04-15
Scope: Recruiter portal routes under `app/(recruiter)/[org]`, recruiter APIs under `app/api/recruiter/*`, and supporting logic in `lib/actions/*`, `lib/hooks/*`, and shared components used by recruiter flows.

## Executive Summary

This audit found multiple recruiter-dashboard issues that can make features appear broken, stale, or inconsistent:

- High-severity authorization/context mismatches in recruiter actions.
- High-severity functional mismatch between company-scoped listing and recruiter-scoped mutation checks.
- Medium-severity broken filter behavior and stale data behavior.
- Medium-severity schema/query coupling risks that can result in missing data.

Total findings: 10
- Critical: 0
- High: 4
- Medium: 5
- Low: 1

## Remediation Status (Updated 2026-04-15)

- 1) Fixed in code: recruiter auth and scope checks added to `updateApplicationStatus`.
- 2) Fixed in code: `createInterview` authorization aligned with company scope.
- 3) Fixed in code: job update authorization aligned with company scope.
- 4) Fixed in code: interview `duration_min` and `type` are persisted.
- 5) Fixed in code: applications page now wires `jobId`, `fromDate`, `toDate`, and status filter.
- 6) Fixed in code: team queries now fall back to `company` when `company_name` is missing.
- 7) Fixed in code: recruiter/company scope queries hardened to avoid raw `.or(...)` interpolation risk.
- 8) Fixed in code: saved candidates no longer depend on hardcoded FK relation names.
- 9) Fixed in code: recruiter org route consistency guard added at `app/(recruiter)/[org]/layout.tsx`.
- 10) Fixed in code: recruiter path revalidation now resolves org fallback when org segment is missing.

Validation note:
- Static diagnostics for modified recruiter files are clean.
- Full runtime E2E verification for recruiter flows is still recommended before release.

---

## Findings

## 1) High - Application status mutation lacks explicit recruiter authorization/ownership check

Category: Non-functional / Security-sensitive mutation path

Evidence:
- `lib/actions/mutations.ts` (`updateApplicationStatus`): fetches and updates by `applicationId` only.
- No call to `getCurrentProfile()` and no check that application belongs to current recruiter/company before update.

Why this is a bug:
- Recruiter-side UI actions can fail unpredictably depending on RLS behavior.
- If RLS is permissive/misconfigured, one recruiter could change statuses outside their scope.

Repro:
1. Trigger status update from recruiter pipeline UI.
2. Observe mutation is not constrained server-side by recruiter context in this function.

Impact:
- Status updates can be non-functional or unsafe depending on DB policy state.

Suggested fix:
- In `updateApplicationStatus`, resolve current profile and enforce recruiter ownership by joining application -> job -> recruiter/company scope before update.

---

## 2) High - Company-scoped applications are visible, but interview scheduling enforces recruiter-owned job only

Category: Data visible but action non-functional

Evidence:
- `lib/actions/database.ts` (`getAllApplicationsForRecruiter`) includes company-level jobs via recruiter/company scope.
- `lib/actions/mutations.ts` (`createInterview`) validates selected job using:
  - `.eq('id', interviewData.job_id)`
  - `.eq('recruiter_id', interviewData.recruiter_id)`

Why this is a bug:
- Recruiters can see applications for company jobs in shared-company mode, but cannot schedule interviews unless they are the exact owner recruiter.

Repro:
1. Recruiter A and Recruiter B belong to same company.
2. Recruiter B opens applications for a job posted by Recruiter A.
3. Click schedule interview.
4. Server rejects with "Selected job is not owned by this recruiter."

Impact:
- Core recruiter workflow appears broken for team/company collaboration.

Suggested fix:
- Align `createInterview` scope with company-level visibility (same policy used in dashboard/applications retrieval).

---

## 3) High - Jobs list shows company jobs, but edit mutation enforces direct recruiter ownership

Category: Data/action scope mismatch

Evidence:
- `lib/actions/database.ts` (`getRecruiterJobs`) fetches by company when `company_name` exists.
- `app/(recruiter)/[org]/jobs/jobs-client.tsx` renders Edit button for each listed job.
- `lib/actions/mutations.ts` (`updateJob`) validates with `.eq('recruiter_id', recruiterId)`.

Why this is a bug:
- Recruiters can click Edit on jobs returned by company scope but are blocked by ownership check.

Repro:
1. View job list with company-shared jobs.
2. Open edit for teammate-owned job.
3. Save update -> returns "Job not found for this recruiter."

Impact:
- Edit flow is non-functional for a visible subset of jobs.

Suggested fix:
- Either restrict UI to only own jobs for edit actions, or allow authorized company-team editing consistently.

---

## 4) High - Interview create flow drops user-entered fields (`duration_min`, `type`)

Category: Data not persisted / functional correctness

Evidence:
- `app/(recruiter)/[org]/interviews/interview-scheduling-client.tsx` sends `duration_min` and `type`.
- `lib/actions/mutations.ts` (`createInterview`) inserts only:
  - `recruiter_id`, `student_id`, `job_id`, `scheduled_at`, `status`, `meeting_link`, `notes`
- Missing insert for `duration_min` and `type`.

Why this is a bug:
- User-configured interview metadata is ignored; later views fall back to defaults/derived values.

Repro:
1. Schedule interview with custom duration/type.
2. Reload interviews.
3. Observe duration/type not preserved as entered.

Impact:
- Interview details appear incorrect and inconsistent.

Suggested fix:
- Persist `duration_min` and `type` in insert payload if columns exist.

---

## 5) Medium - Applications URL filters (`jobId`, `fromDate`, `toDate`) are effectively non-functional from dashboard links

Category: Filtering not working properly

Evidence:
- `app/(recruiter)/[org]/dashboard/dashboard-data-client.tsx` links to `/${org}/applications?jobId=${job.id}`.
- `app/(recruiter)/[org]/applications/page.tsx` only normalizes `filter` from `searchParams`; `getAllApplicationsForRecruiter` is called without `jobId/fromDate/toDate` options.

Why this is a bug:
- Deep links imply filter support, but the page ignores these parameters.

Repro:
1. Click "View X Applications" from a job card in dashboard.
2. Applications page opens but does not apply `jobId` filter server-side.

Impact:
- Recruiters perceive filter links as broken.

Suggested fix:
- Parse `jobId`, `fromDate`, `toDate` in `applications/page.tsx` and pass into `getAllApplicationsForRecruiter` query options.

---

## 6) Medium - Team page silently shows empty list when recruiter has no `company_name`

Category: Data not showing

Evidence:
- `lib/actions/database.ts` (`getTeamMembers`) loads recruiter with `.select('company_name')`.
- If `!currentRecruiter?.company_name`, function returns `[]` with no fallback.

Why this is a bug:
- Team page can show no members even when recruiter records exist (e.g., only `company` field populated or incomplete profile).

Repro:
1. Recruiter record missing `company_name`.
2. Open Team page.
3. Team appears empty without actionable message.

Impact:
- False "no team" state and broken collaboration perception.

Suggested fix:
- Fallback to `company` and/or show explicit configuration warning.

---

## 7) Medium - Realtime application/job scope query can break with special characters in `company_name`

Category: Data not showing intermittently

Evidence:
- `lib/hooks/useRealtime.ts` builds `.or(...)` strings using direct interpolation, including `company.eq.${companyName}`.

Why this is a bug:
- Unescaped special characters in company names can produce invalid filter expressions.

Repro:
1. Use company name with special characters (quotes, commas, etc.).
2. Open applications/interviews pages relying on realtime job scope.
3. Observe fetch errors or missing data.

Impact:
- Intermittent missing data in recruiter pipelines.

Suggested fix:
- Avoid manual `.or` string interpolation with raw values; use safer query construction/encoding strategy.

---

## 8) Medium - Saved candidates query is tightly coupled to a hardcoded FK name

Category: Data not showing after schema drift

Evidence:
- `lib/actions/database.ts` (`getSavedCandidates`) uses:
  - `profiles!saved_candidates_student_id_fkey(...)`

Why this is a bug:
- If the FK name changes in migrations, join fails and shortlist data can disappear.

Repro:
1. Rename the FK in schema migration.
2. Load saved candidates page.
3. Candidate profile join fails; page may show incomplete/empty data.

Impact:
- Shortlist page fragility across DB migrations.

Suggested fix:
- Use stable relation patterns or add migration checks/tests to lock FK naming assumptions.

---

## 9) Medium - Missing recruiter dashboard/org consistency validation allows ambiguous org routing context

Category: Route/context correctness

Evidence:
- `lib/auth/route-context.ts` only validates user type; it does not validate `[org]` param against recruiter organization context.

Why this is a bug:
- Same recruiter data can be opened under arbitrary org slugs, causing inconsistent navigation context and confusing deep links.

Repro:
1. Open recruiter routes under any arbitrary `/{org}/...` slug.
2. Data still loads based on authenticated profile.

Impact:
- "Wrong org" URL can appear valid; creates confusion in shared links and support debugging.

Suggested fix:
- Add optional org-to-profile consistency guard for recruiter routes.

---

## 10) Low - Saved-candidate path revalidation silently no-ops when `org` is empty

Category: Stale UI edge case

Evidence:
- `lib/actions/database.ts` (`revalidateRecruiterCandidatePaths`) exits early when `!org`.
- `components/save-candidate-button.tsx` derives org from pathname first segment.

Why this is a bug:
- If org resolution fails for any edge path, mutation succeeds but cache/path revalidation is skipped.

Repro:
1. Trigger save/unsave with missing/empty org context.
2. Observe stale pages until manual refresh.

Impact:
- Occasional stale shortlist/application/candidate pages.

Suggested fix:
- Fail-safe with fallback org resolution server-side (from recruiter profile/company), or log warning and force broader revalidation.

---

## Testing Gaps

1. No integration tests for recruiter company-shared visibility vs mutation permissions (jobs/interviews/actions).
2. No route-level tests asserting query-parameter filters are honored in `applications` page loader.
3. No tests for interview payload persistence (duration/type round-trip).
4. No resilience tests for special-character company names in realtime query builders.
5. No migration-contract test for FK-dependent joins in saved-candidate query.

---

## Recommended Priority Order

1. Fix recruiter action authorization/scope consistency (`updateApplicationStatus`, `createInterview`, `updateJob` behavior with company scope).
2. Fix applications filter wiring (`jobId/fromDate/toDate`) and verify dashboard deep links.
3. Persist all interview fields (`duration_min`, `type`) and add regression tests.
4. Harden realtime query building and saved-candidates relation handling.
5. Add org-context validation and better team-page fallbacks.
