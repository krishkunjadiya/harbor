# npm run start Production Behavior Audit (2026-04-15)

## Scope
Audit goal: determine why `npm run start` feels like static pages and why many features do not work, compared to `npm run dev`.

## Executive Conclusion
The production app is not being statically exported. Core dashboard routes are server-rendered (dynamic), and the production server responds with Next.js runtime assets.

The primary issue is operational: `npm run start` only starts Harbor (after rebuilding) but does not orchestrate all required dependent services (notably Python worker), so major feature paths fail and the app appears non-functional.

Additionally, the direct `npm run start` execution observed a build-time failure path (PageNotFoundError during page-data collection). That makes startup unreliable and can leave developers with stale assumptions about runtime behavior.

## Reproduction and Evidence
1. Production build route map shows dynamic pages (`ƒ`) for dashboards and role routes.
   - Command run: `npx next build --no-lint`
   - Evidence: route output includes dynamic routes such as `/[org]/dashboard`, `/student/dashboard`, `/[org]/admin/dashboard`.

2. Production server starts normally.
   - Command run: `npx next start -p 3000`
   - Evidence: server ready on localhost:3000.

3. Login page is Next.js runtime page, not plain static HTML.
   - HTTP probe to `/login`: `200`, response contains Next runtime markers (`_next/static` / Next payload markers).

4. Protected dashboard route enforces auth redirect.
   - HTTP probe to `/techcorp/dashboard`: `307` redirect to `/login?redirectTo=%2Ftechcorp%2Fdashboard`.

5. Python worker dependency was not available during audit.
   - Port check did not show healthy worker on `8000`.
   - AI routes depend on worker URL fallback `http://localhost:8000`.

6. Direct `npm run start` showed prestart build instability.
  - Observed output included `PageNotFoundError` for several routes (`/help`, `/admin-dashboard`, `/_not-found`, `/notifications`, `/settings`, `/users`, `/pricing`) followed by `Build error occurred` and `Failed to collect page data for /admin-dashboard`.
  - This failure occurred in the `prestart -> next build` path.
  - A separate no-lint build path (`npx next build --no-lint`) completed successfully, indicating unstable/non-deterministic behavior across build pathways.

## Findings (Ordered by Severity)

### 1) Critical: Secrets are committed in python_worker example env file
- File: `python_worker/.env.example`
- Problem: real-looking Supabase keys, Gemini key, and other credentials are present in a tracked example file.
- Risk:
  - Security exposure and potential account/resource compromise.
  - Invalidates trust in environment handling.
- Why this matters to runtime behavior:
  - Encourages unsafe config practices and environment drift.

### 2) High: `npm run start` does not start required dependent services
- File: `package.json` lines 11-12 (`prestart`, `start`), line 21 (`dev:all`), line 16 (`worker:win`).
- Problem:
  - `start` only runs `next start` (after `prestart` build).
  - No production equivalent script that launches Harbor + Reactive Resume + Python worker together.
- User impact:
  - Resume and AI flows fail even though UI loads.
  - App appears like "static pages" because interactive backend features do not respond.

### 3) High: AI and resume flows are hard runtime dependencies with limited startup validation
- Files:
  - `app/api/analyze-resume/route.ts` line 3 and worker fetch usage.
  - `app/api/interview/evaluate/route.ts` line 5 and worker fetch usage.
  - `app/api/resume/launch/route.ts` lines 69-70 and 89.
- Problem:
  - AI APIs require Python worker availability.
  - Resume launch requires `RESUME_APP_URL` and `RESUME_SSO_SIGNING_KEY` at runtime.
  - There is no unified preflight check at app boot that warns all missing dependencies in one place.
- User impact:
  - Feature clicks fail at runtime, often perceived as broken front-end.

### 4) Medium: Auth behavior can silently bypass gating if Supabase env is incomplete
- File: `lib/supabase/middleware.ts` lines 44-45.
- Problem:
  - Middleware explicitly disables auth checks when Supabase env is missing/placeholder.
- User impact:
  - In misconfigured environments, behavior can appear inconsistent and confusing.

### 5) Medium: `prestart` rebuild on every start increases friction and masks diagnosis
- File: `package.json` line 11.
- Problem:
  - `npm run start` always triggers full build first.
  - Startup delays can be interpreted as server hang or stale behavior.
- User impact:
  - Slow iteration, confusion between build issues and runtime issues.

### 6) Low: Some routes are intentionally static, which can confuse expectation
- File: `app/page.tsx` lines 3-4 (`force-static`, `revalidate`).
- Clarification:
  - Public pages being static is intentional and normal.
  - Dashboard and role routes are still dynamic.

### 7) Medium: Production startup path is unstable due prestart build failures
- File: `package.json` lines 11-12.
- Problem:
  - During audit, `npm run start` failed before server startup with page collection errors.
  - This can be perceived as "broken/static app" because production server is never actually started from that command.
- User impact:
  - Intermittent inability to start production mode.
  - Confusing mismatch where `next build --no-lint` and `next start` work, but full `npm run start` fails.

## Root Cause for "looks static in start"
Most likely combined effect:
1. `npm run start` is run without all dependent services (especially Python worker).
2. Protected or data-heavy features fail or redirect, so only shell/UI is visible.
3. Public static pages exist by design, reinforcing perception that entire app is static.
4. In some runs, `prestart` build itself fails, so production mode never comes up correctly.

## Recommended Fix Plan

### Immediate
1. Remove exposed secrets from `python_worker/.env.example`, rotate all leaked keys, and commit only placeholders.
2. Add production orchestration scripts in root `package.json`:
   - `start:harbor` (next start)
   - `start:resume` (production command for reactive_resume)
   - `start:worker` (uvicorn without reload)
   - `start:all` (concurrently launch all required services)
3. Add a startup dependency check endpoint/script that validates:
   - Supabase connectivity
   - Resume app reachability
   - Python worker health

### Near Term
1. Add a diagnostics page (admin-only) showing dependency health status.
2. Improve user-facing error messages in UI for worker/resume outages.
3. Keep `start` lean for production by removing mandatory `prestart` rebuild in deployment scenarios (build in CI/CD step instead).

## Quick Verification Checklist After Fixes
1. Run `npm run start:all`.
2. Open `/login` and authenticate.
3. Open one route per role (`/student/dashboard`, `/techcorp/dashboard`, `/ppsu/admin/dashboard`).
4. Test AI endpoints (resume analysis, interview evaluation).
5. Confirm no runtime 5xx for missing dependency errors.

## File References
- `package.json`
- `app/api/analyze-resume/route.ts`
- `app/api/interview/evaluate/route.ts`
- `app/api/resume/launch/route.ts`
- `lib/supabase/middleware.ts`
- `app/page.tsx`
- `python_worker/.env.example`
