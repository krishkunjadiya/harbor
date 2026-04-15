# Harbor UI Flaws and Non-Working States Audit
Date: 2026-03-30
Scope: Full-project UI behavior quality audit (static states, broken interactions, misleading progress, and UX debt)

## Final Verification (2026-03-30)
Status: Closed for all items in this audit scope.

Resolved:
1. C1 University student dashboard moved from hardcoded blocks to live server-action-backed analytics.
2. C2 University projects page now uses university-scoped project query instead of student-only fetch.
3. C3 Saved-candidates major filter fixed by using SelectItem in SelectContent.
4. H1 Career insights converted from static demo blocks to live data-driven metrics and recommendations.
5. H2 Primary alert placeholders replaced in audited routes (career insights and university projects details).
6. H3 Activity feed mock fallback removed; empty state now shown when no live activity exists.
7. H4 Recruiter team page now reads real team activity from server action.
8. M1 Resume analyzer low-score color logic corrected to destructive branch.
9. M2 Malformed utility class artifacts removed in audited resume analyzer sections.
10. M3 Student dashboard score semantics refined to Engagement Score with better weighting.
11. M4 Student activity timeline dot token artifact corrected.
12. M5 University project links normalized to avoid broken protocol handling.
13. M6 Faculty Credential palette normalized to semantic token classes.

Validation checks executed:
1. Type/compile diagnostics run for all modified audited files.
2. Targeted pattern scans run for prior broken patterns (mock fallback, invalid select option usage, malformed classes, legacy palette classes).
3. Final polish pass completed:
	- Career Insights converted to live data-driven recommendations and market metrics.
	- Resume Analyzer UX updated to toast notifications instead of blocking alerts.
	- University Projects page updated with explicit loading state.
4. Jest test command was executed and currently fails due existing repository test configuration (ESM/CJS setup issue in jest.setup.js), not due these audited UI changes.

## Executive Summary
This audit identifies critical gaps where dashboards and actions appear functional but are static, placeholder-based, or partially broken. The highest-risk issues are:
- University student dashboard uses hardcoded analytics and progress bars.
- University projects page uses student-only query logic and can show incorrect/empty data.
- Saved candidates major filter is likely non-functional due to invalid Select rendering.

---

## 1) Critical Findings

### C1. University Student Dashboard Is Static (Not Data-Driven)
Severity: Critical
Impact: Admin users see fixed counts, percentages, and progress lines that do not reflect real university data.

Evidence:
- app/(university)/[org]/student/dashboard/page.tsx:24
- app/(university)/[org]/student/dashboard/page.tsx:79
- app/(university)/[org]/student/dashboard/page.tsx:142
- app/(university)/[org]/student/dashboard/page.tsx:225
- app/(university)/[org]/student/dashboard/page.tsx:270

Why it matters:
- Creates false confidence in operational metrics.
- Makes progress visuals look "alive" but they are static literals.

Recommended fix:
1. Replace inline arrays with server-action-backed datasets.
2. Compute progress denominators from live totals, not constants.
3. Add loading, empty, and error states for each analytics card.

### C2. University Projects Page Uses Student Query Pattern
Severity: Critical
Impact: A university page may only pull current user projects, causing incorrect or missing data.

Evidence:
- app/(university)/[org]/student/projects/page.tsx:21
- app/(university)/[org]/student/projects/page.tsx:31
- lib/actions/database.ts:726

Why it matters:
- Role-scope mismatch undermines trust in university-level reporting.

Recommended fix:
1. Create a dedicated university projects query (by university/org scope).
2. Keep student-specific query for student pages only.
3. Validate route-level authorization and dataset ownership.

### C3. Saved Candidates Major Filter Likely Broken
Severity: Critical
Impact: Recruiters may be unable to filter candidates by major.

Evidence:
- app/(recruiter)/[org]/saved-candidates/saved-candidates-client.tsx:117
- app/(recruiter)/[org]/saved-candidates/saved-candidates-client.tsx:123

Why it matters:
- Core recruiter workflow (shortlisting by major) is degraded.

Recommended fix:
1. Replace native option elements with SelectItem inside SelectContent.
2. Add UI test for filter behavior (all -> specific major -> reset).

---

## 2) High Findings

### H1. Career Insights Is Mostly Static Demo Content
Severity: High
Impact: Users receive fixed scores/jobs/trends instead of personalized data.

Evidence:
- app/(student)/student/career-insights/page.tsx:33
- app/(student)/student/career-insights/page.tsx:87
- app/(student)/student/career-insights/page.tsx:280
- app/(student)/student/career-insights/page.tsx:507

Recommended fix:
1. Source readiness score and sub-metrics from profile + resume + job data.
2. Fetch recommendations from real jobs and student skills.
3. Convert static trend blocks to API-backed trend snapshots.

### H2. Alert-Based Placeholders for Primary Actions
Severity: High
Impact: Important CTAs feel fake or unfinished.

Evidence:
- app/(student)/student/career-insights/page.tsx:417
- app/(student)/student/career-insights/page.tsx:452
- app/(student)/student/career-insights/page.tsx:525
- app/(university)/[org]/student/projects/page.tsx:194
- app/(student)/student/resume-analyzer/page.tsx:129

Recommended fix:
1. Replace alert handlers with routed detail pages/dialogs.
2. Standardize notification UX using toast/banner patterns.

### H3. Activity Feed Uses Mock Fallback Data
Severity: High
Impact: Users can see fabricated activity when real feed is empty.

Evidence:
- app/(dashboard)/activity-feed/activity-feed-client.tsx:27
- app/(dashboard)/activity-feed/activity-feed-client.tsx:111

Recommended fix:
1. Remove production mock fallback.
2. Show empty state with explicit "no activity yet" messaging.

### H4. Recruiter Team Activity Is Placeholder Empty
Severity: High
Impact: Team collaboration page lacks actual activity signal.

Evidence:
- app/(recruiter)/[org]/team/page.tsx:14

Recommended fix:
1. Add server action for recent team events.
2. Display last 7-14 day timeline with event types.

---

## 3) Medium Findings

### M1. Resume Analyzer Score Color Logic Is Inconsistent
Severity: Medium
Impact: Low-score states are not visually distinct enough.

Evidence:
- app/(student)/student/resume-analyzer/page.tsx:291
- app/(student)/student/resume-analyzer/page.tsx:457

Recommended fix:
1. Map low score branch to destructive tone consistently.
2. Align circular score stroke colors with score-breakdown bars.

### M2. Residual Malformed Utility Classes Remain
Severity: Medium
Impact: Style behavior can be unpredictable and inconsistent.

Evidence:
- app/(student)/student/resume-analyzer/page.tsx:362
- app/(student)/student/resume-analyzer/page.tsx:384

Recommended fix:
1. Replace malformed classes with valid semantic token classes.
2. Add lint/search guard in CI for invalid class fragments.

### M3. Student Profile Score Formula Is Oversimplified
Severity: Medium
Impact: Reported "completeness" may mislead students.

Evidence:
- app/(student)/student/dashboard/page.tsx:109
- app/(student)/student/dashboard/page.tsx:235

Recommended fix:
1. Use weighted rubric (profile fields, verified credentials, resume quality, active applications).
2. Rename metric until true completeness is implemented.

### M4. Student Activity Dot Uses Token Artifact
Severity: Medium
Impact: Visual inconsistency and potential class mismatch.

Evidence:
- app/(student)/student/dashboard/page.tsx:284

Recommended fix:
1. Replace artifact with valid semantic token class.

### M5. Project URL Handling Can Produce Invalid Links
Severity: Medium
Impact: GitHub/demo links can break when protocol is already present or value is empty.

Evidence:
- app/(university)/[org]/student/projects/page.tsx:240
- app/(university)/[org]/student/projects/page.tsx:252

Recommended fix:
1. Normalize URLs before rendering.
2. Validate and disable link if invalid.

### M6. Legacy Hardcoded Palette in Faculty Credential Stats
Severity: Medium
Impact: Color output does not align with tokenized theme strategy.

Evidence:
- lib/actions/database.ts:1142

Recommended fix:
1. Return semantic token classes or derive colors at UI layer from category mapping.

---

## 4) Priority Remediation Plan

### Phase 1 (Immediate)
1. Fix C1 university dashboard data wiring.
2. Fix C2 projects query scope.
3. Fix C3 saved candidates filter rendering.

### Phase 2 (High Impact)
1. Remove alert placeholders in career insights, projects, resume analyzer.
2. Remove mock activity fallback and implement empty-state behavior.
3. Add recruiter team real recent-activity data source.

### Phase 3 (Quality and Consistency)
1. Align resume analyzer score logic and semantic colors.
2. Remove malformed token artifacts.
3. Implement robust profile completeness scoring.
4. Normalize URL rendering and token class mapping.

---

## 5) Suggested Validation Checklist
1. University dashboard cards and progress bars change when DB data changes.
2. University projects page shows org-wide dataset, not only current user projects.
3. Saved candidates major filter updates result count correctly.
4. No primary CTA opens browser alert for production workflows.
5. Activity feed never renders mock items in production mode.
6. Resume analyzer low/medium/high score coloring is consistent across all widgets.
7. No malformed utility classes remain in audited files.

---

## 6) Notes
- This report focuses on UI behavior correctness and trustworthiness, not only visual aesthetics.
- Some static content may be intentional for early staging/demo, but production routes should be data-backed or explicitly marked as preview.

