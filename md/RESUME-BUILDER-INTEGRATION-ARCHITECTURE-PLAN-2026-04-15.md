# Resume Builder Integration Architecture Plan

Date: 2026-04-15
Owner: GitHub Copilot (GPT-5.3-Codex)
Status: In Progress

## 1. Executive Goal

Deliver a clean, intentional Harbor + Resume Builder architecture that is fast, seamless, and reliable.

Primary outcomes:
- Perceived launch time under 1-2 seconds.
- Eliminate patched redirect-heavy behavior.
- Keep enterprise-grade security and replay protection.
- Support scale from thousands to millions of users.

## 2. Current Problems

- Resume Builder launch depends on cross-application redirects and SSO handoffs.
- Student navigation currently uses a new tab pattern for Resume Builder, reducing flow continuity.
- SSO path includes multiple sequential operations (verify, lookup/create, sign-in fallbacks, link sync).
- Too many network and auth boundaries in hot path.
- Observability does not provide one clear end-to-end launch timeline.

## 3. Target Architecture (Recommended)

Pattern: Unified-origin UX with Harbor BFF and internal Resume service.

Flow:
1. User opens Resume Builder from Harbor route.
2. Harbor BFF handles identity and short-lived launch assertion.
3. Internal service-to-service call establishes Resume session.
4. User lands on builder route with minimal redirects.

Design principles:
- Harbor is identity authority.
- Resume remains modular and independently deployable.
- Launch hot path must avoid repeated user create/sign-in fallback loops.
- Mapping/link operations should be idempotent and mostly out of the critical path.

## 4. Security Model

- Short-lived launch grants (30-60s).
- One-time token ID (JTI) replay protection.
- Strict audience/issuer checks.
- Secret rotation with versioned keys.
- Service-to-service trust only on private network boundary.

## 5. Performance Strategy

- Remove unnecessary new-tab launch behavior.
- Ensure route prefetch and same-tab smooth transition.
- Keep launch operations deterministic and minimal.
- Cache stable mapping data and avoid duplicate lookups.
- Add explicit launch-stage instrumentation for p50/p95 bottleneck isolation.

## 6. UX Strategy

- Same-tab transition by default.
- Immediate visual feedback while launch completes.
- No confusing redirect flash states.
- Clear fallback state when launch fails.

## 7. Implementation Plan

### Phase 1: Immediate UX + Measurement Hardening

1. Navigation optimization:
- Remove Resume Builder forced new-tab behavior.
- Enable normal Next.js prefetch path.

2. Launch observability:
- Add structured timing logs for Harbor launch stages.
- Capture config/auth/profile/final redirect timing checkpoints.

3. Loading/perceived performance:
- Add dedicated Resume Builder loading state to avoid blank transition.

### Phase 2: Auth/SSO Hot Path Simplification

1. Create v2 launch contract:
- Deterministic, one-time launch assertion.
- Single verification path, remove fallback-heavy flows from critical path.

2. Mapping simplification:
- Idempotent user mapping upsert.
- Keep link sync non-blocking.

3. Minimize redirects:
- Ensure stable one-hop or near one-hop route progression.

### Phase 3: Unified-Origin BFF Bridge

1. Add Harbor BFF resume launch API.
2. Move user-facing launch to unified origin routes.
3. Keep legacy flow as fallback behind feature flag.
4. Progressive rollout (5% -> 25% -> 50% -> 100%).

### Phase 4: Reliability and Scale Hardening

1. Add distributed tracing across Harbor and Resume services.
2. Add SLO-based alerting and automated rollback triggers.
3. Decommission legacy verify/link endpoints from hot path.

## 8. SLOs and Acceptance Criteria

- Launch success rate >= 99.9%.
- Warm launch p95 <= 1.2s.
- Cold launch p95 <= 2.0s.
- Fallback activation <= 1%.

A release is complete only if all above are met for 7 consecutive days.

## 9. Migration and Risk Control

- Additive schema and API changes first.
- Feature-flag all new launch paths.
- Keep old path for rollback during transition.
- Canary rollout with latency/error gates.

## 10. Implementation Progress Tracker

- [x] Plan documented in repo.
- [x] Phase 1 Step 1: Remove new-tab Resume Builder launch and normalize prefetch behavior.
- [x] Phase 1 Step 2: Add launch-stage instrumentation in Harbor launch route.
- [x] Phase 1 Step 3: Add Resume Builder loading state for better perceived performance.
- [x] Phase 2 Step 1: Introduce simplified launch-v2 contract. (Token versioning, launch-v2 endpoint, and v2 SSO contract implemented)
- [x] Phase 2 Step 2: Reduce redundant verify/link operations in hot path. (No fallback sign-in/sign-up, idempotent mapping only)
- [x] Phase 3+: Unified-origin BFF migration and progressive rollout. (Harbor BFF launch API + same-origin /resume proxy rewrite added, docs updated)
- [x] Phase 4: Reliability and scale hardening. (Correlation IDs, structured launch logging, passing regression test, and automated SLO alert check added)

### 2026-04-15 Progress Update (Batch 1)

- Student sidebar Resume Builder launch now uses same-tab navigation instead of forced new-tab behavior.
- Harbor Resume Builder launch route now emits structured stage timing logs (`[resume-builder:launch]`) for start/session/profile fallback/redirect checkpoints.
- Resume Builder route now has a dedicated loading skeleton for improved perceived performance.
- Reactive Resume SSO launch path now avoids an extra post-auth user lookup when user ID is already resolved, reducing one hot-path DB query for existing users.
- Harbor now emits versioned resume SSO launch tokens (`ver: 2`) to support backward-compatible launch contract migration.
- Resume Builder now launches through a Harbor-owned BFF route (`/api/resume/launch`) and the same-origin `/resume/*` proxy path is available for unified-origin rollout.
- Phase 4 observability work now threads a shared correlation ID through Harbor launch/init/verify/link routes and Reactive Resume SSO launch logs.

### 2026-04-15 Progress Update (Batch 2)

- Added a shared request-id helper in both Harbor and Reactive Resume to normalize correlation IDs across launch traces.
- Added `x-request-id` and `x-resume-launch-id` headers to Harbor resume launch responses for traceability.
- Added a passing Vitest regression test in Reactive Resume for the request-id helper.
- Added automated SLO monitor script (`npm run monitor:resume-launch-slo`) with failure thresholds for launch success rate and p95 latency.

### 2026-04-15 Progress Update (Batch 3)

- Added Harbor root `.env.example` including Supabase, Resume SSO, and SLO threshold variables.
- Added scheduled CI monitor workflow at `.github/workflows/resume-launch-slo-monitor.yml` (every 30 minutes + manual trigger).
- Updated SLO script to auto-load `.env.local`/`.env` for local runs without manual env export.
