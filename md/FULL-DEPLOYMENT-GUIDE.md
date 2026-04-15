# Harbor Full Deployment Guide (Step by Step)

Date: 2026-04-15

This guide deploys the full Harbor system in production:
- Harbor web app (Next.js) on Vercel
- Reactive Resume as a separate service
- Python worker as a separate service
- Supabase as the shared database/auth/storage

## 1) Architecture You Are Deploying

Harbor is a multi-service system, not a single runtime:
- Harbor app: Next.js app router + API routes in the root project
- Reactive Resume: separate app in reactive_resume/
- Python worker: FastAPI service in python_worker/
- Supabase: shared Postgres/Auth/Storage backend

Because of this, Resume and Python worker must be deployed separately from Harbor.

## 2) Security First (Do This Before Anything Else)

If any secrets were exposed outside your local machine, rotate them now.

Rotate at minimum:
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- RESUME_SSO_SIGNING_KEY
- RESUME_SSO_VERIFY_SECRET
- RESUME_SSO_LINK_SECRET

After rotating, update all deployment environment variables before go-live.

## 3) Prerequisites

- GitHub repo with latest Harbor code
- Vercel account connected to GitHub
- Supabase project ready (URL + anon key + service role key)
- A host for non-Vercel services (Render/Railway/Fly). This guide uses Render examples.

## 4) Deploy Harbor on Vercel

### 4.1 Create Project

1. Open Vercel Dashboard.
2. Click Add New -> Project.
3. Import Harbor repo.
4. Root directory: repository root (Harbor root).
5. Framework preset: Next.js.

### 4.2 Build Settings

Use:
- Install command: npm install
- Build command: npm run build:prod
- Output directory: .next (default)

### 4.3 Harbor Production Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

Required Supabase:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Required app routing:
- NEXT_PUBLIC_APP_URL=https://your-harbor-domain.vercel.app

Required resume bridge:
- RESUME_APP_URL=https://your-resume-domain.com
- RESUME_SSO_SIGNING_KEY=<strong-random-secret>
- RESUME_SSO_VERIFY_SECRET=<strong-random-secret>
- RESUME_SSO_LINK_SECRET=<strong-random-secret>
- RESUME_SSO_TOKEN_TTL_SECONDS=90
- RESUME_USE_UNIFIED_ORIGIN=true

Optional SLO monitor:
- RESUME_ALERT_WINDOW_MINUTES=15
- RESUME_ALERT_MIN_SUCCESS_RATE=0.995
- RESUME_ALERT_MAX_P95_MS=1800

Python integration:
- PYTHON_WORKER_URL=https://your-python-worker-domain.com

### 4.4 Deploy

Trigger first deploy from Vercel UI.

After deploy, save this value:
- Harbor public URL (example: https://harbor-abc.vercel.app)

## 5) Deploy Reactive Resume (Separate Service)

You have two good options. Choose one.

## Option A (Recommended): Deploy Reactive Resume on Render

### 5.1 Create Web Service

1. In Render, create a new Web Service from the same repo.
2. Root directory: reactive_resume
3. Runtime: Node

Suggested commands:
- Build command: corepack enable && pnpm install --frozen-lockfile && pnpm build
- Start command: pnpm start

### 5.2 Reactive Resume Environment Variables

Set based on reactive_resume/.env.example:

Core server:
- TZ=Etc/UTC
- APP_URL=https://your-resume-domain.com
- PRINTER_APP_URL=https://your-resume-domain.com

Database:
- DATABASE_URL=<supabase-postgres-connection-string-with-sslmode=require>
- SKIP_DB_MIGRATIONS=false

Auth:
- AUTH_SECRET=<openssl-rand-hex-32-output>

Harbor SSO bridge:
- HARBOR_APP_URL=https://your-harbor-domain.vercel.app
- HARBOR_SSO_VERIFY_URL=https://your-harbor-domain.vercel.app/api/resume/sso/verify
- HARBOR_SSO_LINK_URL=https://your-harbor-domain.vercel.app/api/resume/sso/link
- HARBOR_SSO_VERIFY_SECRET=<same-value-as-RESUME_SSO_VERIFY_SECRET-in-Harbor>
- HARBOR_SSO_LINK_SECRET=<same-value-as-RESUME_SSO_LINK_SECRET-in-Harbor>
- HARBOR_SSO_PASSWORD_SECRET=<extra-random-secret>

Optional email/storage flags can be configured later.

### 5.3 Save Resume URL in Harbor

Set Harbor RESUME_APP_URL to this deployed Resume URL and redeploy Harbor.

## Option B: Deploy Reactive Resume on Vercel

This may work depending on runtime compatibility of your current reactive_resume stack.

1. Create a second Vercel project from same repo.
2. Root directory: reactive_resume
3. Install command: corepack enable && pnpm install --frozen-lockfile
4. Build command: pnpm build
5. Add the same environment variables as Option A.

If runtime/start issues occur, use Option A on Render.

## 6) Deploy Python Worker (Separate Service)

## 6.1 Create Web Service (Render Example)

1. Create a new Render Web Service from same repo.
2. Root directory: python_worker
3. Runtime: Python

Suggested commands:
- Build command: pip install -r requirements.txt
- Start command: uvicorn main:app --host 0.0.0.0 --port $PORT

Python version pin (important):
- Render defaults to Python 3.14 for new services, which can break scipy/scikit-learn/torch installs.
- Pin Python to 3.11.11 using either:
	- Environment variable in Render: PYTHON_VERSION=3.11.11
	- Or this repo file in worker root: python_worker/.python-version (already set to 3.11.11)

### 6.2 Python Worker Environment Variables

Set from python_worker/.env.example (use real production values):

Required:
- SUPABASE_URL=https://your-project.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

Recommended:
- LOG_LEVEL=INFO
- ENVIRONMENT=production

Optional AI/features:
- GEMINI_API_KEY
- ONET_USERNAME
- ONET_PASSWORD

Note: python_worker/.env.example currently includes real-looking values. Do not reuse those. Generate new secrets and use your own project credentials.

### 6.3 CORS for Production

Current CORS in python_worker/main.py allows only localhost origins by default.

For production, include your deployed domains in allow_origins, for example:
- https://your-harbor-domain.vercel.app
- https://your-resume-domain.com

Then redeploy the Python worker.

### 6.4 Save Worker URL in Harbor

Set Harbor PYTHON_WORKER_URL to the deployed worker URL and redeploy Harbor.

## 7) Supabase Production Configuration

In Supabase Dashboard:

1. Authentication -> URL Configuration:
- Site URL: Harbor production URL
- Additional redirect URLs: Harbor + Resume URLs as needed

2. Run SQL migrations from sql/ folder if not already applied.

3. Confirm required tables for resume SSO exist (resume_sso_audit, resume_sso_consumed_tokens, resume_user_links) if your code path uses them.

## 8) Final Environment Mapping (Quick Table)

Harbor (Vercel):
- NEXT_PUBLIC_SUPABASE_URL -> Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY -> Supabase anon key
- SUPABASE_SERVICE_ROLE_KEY -> Supabase service role key
- NEXT_PUBLIC_APP_URL -> Harbor domain
- RESUME_APP_URL -> Resume domain
- RESUME_SSO_SIGNING_KEY -> Shared with Harbor token generation only
- RESUME_SSO_VERIFY_SECRET -> Must match Resume HARBOR_SSO_VERIFY_SECRET
- RESUME_SSO_LINK_SECRET -> Must match Resume HARBOR_SSO_LINK_SECRET
- PYTHON_WORKER_URL -> Python worker domain

Reactive Resume:
- APP_URL -> Resume domain
- DATABASE_URL -> Supabase Postgres URL
- AUTH_SECRET -> Resume auth secret
- HARBOR_SSO_VERIFY_URL -> Harbor verify endpoint
- HARBOR_SSO_LINK_URL -> Harbor link endpoint
- HARBOR_SSO_VERIFY_SECRET -> Match Harbor RESUME_SSO_VERIFY_SECRET
- HARBOR_SSO_LINK_SECRET -> Match Harbor RESUME_SSO_LINK_SECRET

Python worker:
- SUPABASE_URL -> Supabase URL
- SUPABASE_SERVICE_ROLE_KEY -> Supabase service role key
- GEMINI_API_KEY -> Optional AI key

## 9) Verification Checklist

After all deployments:

1. Harbor opens and users can log in.
2. Resume launch from Harbor works without token errors.
3. Resume user-link flow succeeds.
4. Python worker health responds at /health.
5. Resume analysis flow can reach Python worker.
6. No CORS errors in browser console.
7. Supabase auth redirects return to production URLs.

## 10) Troubleshooting

Issue: Resume launch fails from Harbor
- Check RESUME_APP_URL in Harbor
- Check secret matching between Harbor and Resume
- Check Harbor endpoints /api/resume/sso/verify and /api/resume/sso/link are reachable

Issue: Resume app opens but Harbor user cannot log in with Harbor credentials
- Ensure Harbor endpoint /api/resume/sso/password-login is deployed.
- Ensure Resume has HARBOR_APP_URL and HARBOR_SSO_VERIFY_SECRET configured.
- Ensure Harbor has RESUME_SSO_SIGNING_KEY and RESUME_SSO_VERIFY_SECRET configured.

Issue: Harbor cannot call Python worker
- Check PYTHON_WORKER_URL in Harbor
- Check Python worker is running on public HTTPS URL
- Check CORS allow_origins includes Harbor domain

Issue: Build fails on Vercel
- Use npm run build:prod for Harbor
- Confirm all required env vars are set in Production scope

Issue: Python worker fails installing scipy on Render (gfortran / meson error)
- Cause: Service is using Python 3.14 and trying to compile scipy from source.
- Fix: Pin PYTHON_VERSION to 3.11.11 and redeploy.
- Optional: Clear build cache before redeploying.

Issue: Resume app deployment unstable on Vercel
- Move Resume to Render (Option A), keep Harbor on Vercel

Issue: Resume app returns 504 with ENOENT scandir './migrations' on Vercel
- Cause: Serverless runtime package may not contain migrations folder at startup.
- Fix path in code: reactive_resume/plugins/1.migrate.ts now resolves migrations path dynamically and skips startup migration if folder is missing.
- Immediate fallback: set SKIP_DB_MIGRATIONS=true in Resume environment variables and redeploy.
- Long-term: run migrations as a separate one-off step (drizzle-kit migrate) instead of relying only on startup migration in serverless.

## 11) Minimal Go-Live Order

1. Rotate secrets
2. Deploy Python worker
3. Deploy Resume
4. Deploy Harbor with final RESUME_APP_URL and PYTHON_WORKER_URL
5. Configure Supabase redirect URLs
6. End-to-end test login, resume launch, and analysis

---

Maintainer note:
- Keep this file updated when env keys or SSO flows change.
