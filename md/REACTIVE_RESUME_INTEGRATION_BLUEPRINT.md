# Reactive Resume Integration Blueprint for Harbor

## 1) Goal
Integrate the standalone reactive_resume app into Harbor so students can build and manage resumes without a second login, while keeping Harbor as the system of record for identity and profile context.

This blueprint is optimized for your current architecture:
- Harbor: Next.js + Supabase auth + role-based routes.
- reactive_resume: separate full-stack app with Better Auth + PostgreSQL.

## 2) Recommended Integration Strategy
Use a service-integration model first (recommended for speed and low risk):

- Keep reactive_resume as a separate deployable service.
- Add Harbor-to-reactive_resume SSO token exchange.
- Store a user mapping table in Harbor (Supabase).
- Embed or deep-link resume builder from Harbor student area.
- Sync selected profile data from Harbor to reactive_resume on demand.

Why this strategy:
- No risky rewrite of reactive_resume auth internals.
- Minimal disruption to Harbor's current Supabase auth model.
- Can be implemented incrementally and rolled back safely.

## 3) Current Harbor Anchors (Verified)
Harbor already has:
- Supabase auth and profile fetch patterns: lib/auth/get-user-profile.ts and lib/actions/database.ts.
- Student/recruiter/university role logic and redirects: app/dashboard/page.tsx.
- Existing resume analysis API surface: app/api/analyze-resume/route.ts.

This means Harbor can become the identity issuer and orchestration layer for resume features.

## 4) Target Architecture

### 4.1 Logical Flow
1. User logs into Harbor (Supabase session).
2. Student opens Resume Builder page in Harbor.
3. Harbor calls a secure server route to mint a short-lived bridge token.
4. Harbor redirects user to reactive_resume with one-time token.
5. reactive_resume verifies token with Harbor verification endpoint.
6. reactive_resume signs in or creates mapped local user.
7. User lands directly in resume dashboard/builder.

### 4.2 Trust Boundary
- Harbor is source of truth for identity and role.
- reactive_resume is source of truth for resume documents.
- Bridge token lifetime should be very short (60 to 120 seconds).

## 5) Data Contract and Mapping
Create a mapping table in Supabase (Harbor DB):

Table: resume_user_links
- id: uuid primary key
- harbor_user_id: uuid not null unique (references profiles.id)
- resume_user_id: uuid not null unique (reactive_resume user id)
- status: text default active
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Optional audit table:

Table: resume_sso_audit
- id: uuid primary key
- harbor_user_id: uuid
- action: text (issue_token, verify_token, link_created, login_success, login_failed)
- ip: text
- user_agent: text
- metadata: jsonb
- created_at: timestamptz default now()

## 6) API Design (Harbor Side)
Add server-only endpoints in Harbor:

### 6.1 POST /api/resume/sso/init
Purpose:
- Validate current Supabase session.
- Validate role (student only in phase 1).
- Issue signed one-time token with short TTL.

Input:
- optional returnPath.

Output:
- launchUrl for reactive_resume, for example:
  https://resume.yourdomain.com/sso/launch?token=...

Token claims:
- iss: harbor
- aud: reactive_resume
- sub: harbor_user_id
- email
- full_name
- role
- iat
- exp (iat + 60s)
- jti

### 6.2 POST /api/resume/sso/verify
Purpose:
- Called by reactive_resume backend only.
- Verifies token signature, exp, aud, jti replay.
- Returns normalized user payload.

Input:
- token

Output:
- valid
- harborUser object
  - id
  - email
  - name
  - role

### 6.3 POST /api/resume/sync-profile
Purpose:
- Push selected profile fields from Harbor to reactive_resume.
- Can be invoked after profile changes or before launching builder.

Input:
- harbor user id from session.

Output:
- sync status.

## 7) API Design (reactive_resume Side)
Add an SSO bridge route in reactive_resume:

### 7.1 GET /sso/launch
Purpose:
- Receive one-time token from Harbor.
- Call Harbor /api/resume/sso/verify server-to-server.
- Find or create local Better Auth user.
- Create reactive_resume session cookie.
- Redirect to /dashboard or /builder/:id.

Implementation notes:
- Never trust client-provided profile directly.
- Verify token only by server call to Harbor.
- Prevent token replay via jti cache table or Redis.

### 7.2 User Provisioning Rules
- If link exists in resume_user_links, use mapped resume_user_id.
- Else create reactive_resume user and create link in Harbor.
- Keep immutable identity key as harbor_user_id.

## 8) Security Controls
Mandatory controls:
- HS256 or RS256 signed token, rotate keys regularly.
- Token TTL <= 120 seconds.
- One-time use via jti replay protection.
- Allowlist calls to Harbor verify endpoint from reactive_resume backend only.
- Enforce HTTPS everywhere.
- Log all SSO events (success and failure).
- Rate limit SSO init and verify routes.

Recommended controls:
- Add device and IP context checks in audit.
- Add origin checks and CSRF protection on Harbor init endpoint.
- Return generic error messages for auth failures.

## 9) UI Integration in Harbor
Phase 1 (student only):
- Add Resume Builder entry on student dashboard sidebar.
- Add Resume Builder CTA on student profile page.
- Optional: add Resume status card (last edited, total resumes).

Behavior:
- click CTA -> Harbor calls /api/resume/sso/init -> redirect to launchUrl.

## 10) Profile Sync Scope
Sync only safe and useful fields first:
- full name
- email
- phone
- location
- headline
- summary
- education entries
- experience entries
- skills

Do not sync by default in phase 1:
- sensitive academic records not needed for CV
- internal permissions flags

Sync mode recommendation:
- On-demand sync before first launch.
- Manual "Import from Harbor Profile" action inside resume builder.

## 11) Rollout Plan

### Phase A: Foundation (1 to 2 days)
- Create resume_user_links and optional audit table in Supabase.
- Add Harbor SSO init and verify endpoints.
- Add secrets and environment configuration.

### Phase B: Reactive Resume Bridge (2 to 3 days)
- Add /sso/launch route in reactive_resume.
- Implement verify call to Harbor.
- Implement create or login mapped user.
- Add replay protection.

### Phase C: Harbor UI Entry Points (1 day)
- Add student dashboard CTA.
- Add menu item and launch flow.
- Add failure and retry UX.

### Phase D: Sync and Observability (1 to 2 days)
- Add profile sync endpoint.
- Add event logging and dashboards.
- Add alerting for SSO failure rates.

### Phase E: Expansion (later)
- Enable for recruiter role if needed.
- Add export/import resume JSON into Harbor storage if business requires it.

## 12) Environment Variables

Harbor:
- RESUME_APP_URL
- RESUME_SSO_SIGNING_KEY (or private key)
- RESUME_SSO_VERIFY_AUDIENCE
- RESUME_SSO_TOKEN_TTL_SECONDS

reactive_resume:
- HARBOR_BASE_URL
- HARBOR_SSO_VERIFY_URL
- HARBOR_SSO_SHARED_KEY (or public key)
- HARBOR_SSO_TIMEOUT_MS

## 13) Failure Handling
If verify fails:
- reactive_resume redirects back to Harbor with reason code.
- Harbor shows actionable message and retry button.

If user provisioning fails:
- return stable error code.
- keep retry idempotent.

If mapping inconsistency occurs:
- log critical event.
- block login until remapped by admin repair script.

## 14) Testing Checklist

Functional:
- Student can launch builder from Harbor without extra login.
- Repeat launch reuses same mapped account.
- Expired token is rejected.
- Tampered token is rejected.
- Replay token is rejected.

Security:
- Verify endpoint rejects requests without valid service auth.
- SSO logs contain jti and user id for traceability.
- Session cookie flags secure and httpOnly in production.

Operational:
- Service outage in reactive_resume shows graceful Harbor error.
- Harbor outage during verify is handled by retry or fallback page.

## 15) Risks and Mitigations

Risk: account duplication across systems.
- Mitigation: enforce unique harbor_user_id mapping and idempotent provisioning.

Risk: token leakage in logs.
- Mitigation: never log raw tokens, only jti and hash.

Risk: role misuse.
- Mitigation: validate role at Harbor init endpoint and again at verify.

Risk: lock-in to dual auth models.
- Mitigation: keep bridge abstraction and isolate in dedicated SSO modules.

## 16) Future Option (Deep Unification)
If later you want one auth system only, plan a separate migration project:
- move reactive_resume auth to Supabase-compatible identity,
- migrate users and sessions,
- remove bridge token path after stabilization.

This is a higher-effort phase and should not block initial integration.

## 17) Immediate Next Implementation Tasks
1. Create Supabase migration for resume_user_links and audit table.
2. Implement Harbor endpoints: /api/resume/sso/init and /api/resume/sso/verify.
3. Implement reactive_resume /sso/launch route with one-time token verification.
4. Add student dashboard Resume Builder button and launch redirect.
5. Add logs, rate limits, and replay protection before production use.
