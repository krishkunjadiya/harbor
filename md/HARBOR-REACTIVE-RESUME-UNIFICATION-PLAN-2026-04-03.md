# Harbor + Reactive Resume Unification Plan

Date: 2026-04-03
Owner: GitHub Copilot (GPT-5.3-Codex)
Status: Proposed Implementation Plan

## 1. Problem Summary

Current behavior is too slow and unreliable when opening Resume Builder from Harbor:
- Launch takes much longer than normal Harbor page navigation.
- Users sometimes hit SSO errors (example: token expiration).
- Two-server bridge introduces extra redirects/network hops.
- User expectation is seamless app-like behavior: click Resume Builder and open immediately with current logged-in user.

## 2. Root Cause (Why It Is Slow)

Main causes in current architecture:
1. Cross-app bridge flow:
- Harbor issues token -> redirect to reactive_resume /sso/launch -> auth/session establishment -> redirect again.
- Multiple sequential steps increase latency.

2. Multi-server dev/runtime overhead:
- Harbor and reactive_resume run separately (port 3000 and 3001).
- First request often hits route compilation/cold-start in dev mode.

3. Tokenized handoff fragility:
- Token TTL/clock skew/replay behavior can cause launch failures.
- Any delay in chain increases chance of failure.

4. Additional side operations during launch:
- User mapping/link calls and auth fallbacks can add time.

## 3. Target Outcome

Make Resume Builder feel like an internal Harbor page:
- Same-origin navigation experience.
- No bridge token delays for normal logged-in users.
- Open Builder with active Harbor user context.
- No visible SSO/token expiry errors in normal usage.

## 4. Recommended Best Solution

## Unify as one product surface (single-origin experience), keep reactive_resume engine modular.

This does NOT require rewriting all reactive_resume features immediately.
It means Harbor becomes the primary entry and routing shell for users.

## 5. Implementation Strategy (Phased)

### Phase 1 (Immediate, low-risk): Single-entry launch hardening
Goal: Remove bridge pain quickly while preserving existing codebases.

Tasks:
1. Enforce direct server launch path only:
- Keep Harbor button navigation to server launch endpoint/page only.
- No client prefetch bridge fetch.

2. Stabilize token/session window:
- Increase effective tolerance for dev timing and route compilation.
- Ensure launch path does not fail due to short delays.

3. Remove blocking side operations from critical path:
- Harbor-link sync remains best-effort/non-blocking.
- No user-facing impact from link endpoint outages.

4. Add precise timing instrumentation:
- Log and measure each hop:
  - Harbor launch endpoint start/end
  - reactive_resume /sso/launch start/end
  - session established
  - final redirect completed

Deliverable:
- Reproducible timing report with exact bottleneck numbers.

---

### Phase 2 (Recommended): One-domain user routing
Goal: Make navigation feel native.

Tasks:
1. Expose Resume Builder under Harbor-owned route namespace:
- Example: /student/resume/* within Harbor UX entry.

2. Keep reactive_resume runtime behind internal boundary:
- User sees single app journey.
- Internal service boundary remains but hidden from user flow.

3. Align auth identity mapping once per user:
- Deterministic user link; no repeated expensive auth probes.

Deliverable:
- From Harbor click -> Resume Builder route opens in one hop with active session.

---

### Phase 3 (Full unification): Shared auth/session model
Goal: Eliminate bridge token for internal navigation.

Tasks:
1. Standardize session trust model between Harbor and Resume Builder.
2. Replace token launch bridge with shared authenticated context.
3. Keep fallback bridge only for external/system integrations.

Deliverable:
- Same behavior and speed profile as standard Harbor pages.

## 6. Concrete Work Plan I Will Execute

1. Add instrumentation first (no behavior guessing):
- Record exact milliseconds for each launch stage.

2. Implement one-hop launch route:
- Ensure click -> server route -> final builder target only.

3. Remove remaining expensive checks from launch critical path:
- Keep only required identity validation.

4. Move user to direct builder target deterministically:
- Latest resume or create/route predictably.

5. Validate with test accounts:
- Student account from sorted list.
- Confirm launch time reduction and no token-expired behavior.

6. Produce post-fix report:
- Before vs after timings.
- Remaining risks and next migration step.

## 7. Acceptance Criteria

Must all pass:
1. Clicking Resume Builder opens builder reliably with logged-in Harbor user.
2. No normal-flow token expiry errors.
3. Launch speed close to normal Harbor navigation (allowing first cold compile only once in dev).
4. Subsequent launches are consistently fast.
5. No user-visible bridge errors.

## 8. Risks and Mitigations

Risk: Deep full merge in one shot can break auth/routes.
Mitigation: phased rollout with measurable checkpoints.

Risk: Dev-mode compilation still impacts first hit.
Mitigation: compare warm timing and optionally pre-warm critical routes.

Risk: Hidden dependency between reactive_resume auth and DB schema.
Mitigation: keep reactive_resume internals intact while changing entry/orchestration first.

## 9. Decision

Recommended path: execute Phase 1 + Phase 2 immediately, then Phase 3 if needed.

Reason:
- Delivers user-perceived speed and reliability fastest.
- Lowest break risk.
- Preserves investment in reactive_resume while removing bridge pain.

## 10. Next Action

Upon your confirmation, I will start with instrumentation + one-hop launch hardening and share a measured before/after timing table in a second markdown report.
