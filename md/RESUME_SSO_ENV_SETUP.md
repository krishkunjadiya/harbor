# Resume SSO Environment Setup

This file gives you a single place to configure secrets for Harbor and reactive_resume.

## 1) Generate Secrets
Use PowerShell to generate strong random values.

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate at least two values:
- Secret A for verify/auth between services.
- Secret B for deterministic SSO password derivation.

## 2) Harbor Environment Variables
Set these in Harbor environment (for local .env.local or your deployment secret manager):

```env
RESUME_APP_URL=http://localhost:3000
RESUME_SSO_SIGNING_KEY=<GENERATED_SECRET_FOR_TOKEN_SIGNING>
RESUME_SSO_VERIFY_SECRET=<GENERATED_SHARED_VERIFY_SECRET>
RESUME_SSO_LINK_SECRET=<SAME_AS_VERIFY_SECRET_OR_ANOTHER_STRONG_SECRET>
RESUME_SSO_TOKEN_TTL_SECONDS=90
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
```

Notes:
- RESUME_SSO_VERIFY_SECRET is checked by Harbor verify and link endpoints.
- RESUME_SSO_LINK_SECRET is optional in current code and falls back to RESUME_SSO_VERIFY_SECRET.

## 3) reactive_resume Environment Variables
Set these in reactive_resume .env:

```env
HARBOR_SSO_VERIFY_URL=http://localhost:3000/api/resume/sso/verify
HARBOR_SSO_LINK_URL=http://localhost:3000/api/resume/sso/link
HARBOR_SSO_VERIFY_SECRET=<MUST_MATCH_HARBOR_RESUME_SSO_VERIFY_SECRET>
HARBOR_SSO_PASSWORD_SECRET=<GENERATED_SECRET_FOR_PASSWORD_DERIVATION>
```

Important:
- HARBOR_SSO_VERIFY_SECRET must exactly match Harbor RESUME_SSO_VERIFY_SECRET.
- If HARBOR_SSO_PASSWORD_SECRET is empty, reactive_resume falls back to AUTH_SECRET.

## 4) Required SQL Migration
Run this in Supabase SQL editor before testing:
- sql/create-resume-sso-tables.sql

## 5) Quick Local Validation
1. Start Harbor.
2. Start reactive_resume.
3. Log in as a student in Harbor.
4. Open Student Dashboard and click Open Resume Builder.
5. Confirm redirect lands in reactive_resume dashboard without manual login.

## 6) Common Failure Checks
- 403 from verify endpoint:
  - Secret mismatch between HARBOR_SSO_VERIFY_SECRET and RESUME_SSO_VERIFY_SECRET.
- Redirect goes to login page:
  - Verify route received token but session bootstrap failed.
  - Check reactive_resume logs for sso/launch sign-in errors.
- Link not written:
  - Check HARBOR_SSO_LINK_URL and RESUME_SSO_LINK_SECRET/RESUME_SSO_VERIFY_SECRET.
  - Confirm Supabase table resume_user_links exists.

## 7) Security Rules
- Never commit real secrets into git.
- Use separate secrets per environment (dev, staging, production).
- Rotate secrets periodically.
- Keep token TTL low (60 to 120 seconds).

Not all of them should be different.

You listed 5 keys (not 4), and the correct relationship is:

1. `RESUME_SSO_VERIFY_SECRET` and `HARBOR_SSO_VERIFY_SECRET`
- These must be exactly the same value.
- Reason: one app sends it, the other verifies it.

2. `RESUME_SSO_SIGNING_KEY`
- Should be different from all other keys.
- Reason: used to sign Harbor-issued SSO tokens.

3. `HARBOR_SSO_PASSWORD_SECRET`
- Should be different from all others.
- Reason: used to derive deterministic SSO password on reactive_resume side.

4. `RESUME_SSO_LINK_SECRET`
- Can be either:
  - same as `RESUME_SSO_VERIFY_SECRET` (simple setup), or
  - different (more strict separation).

Recommended secure setup:
1. Keep verify pair same:
- `RESUME_SSO_VERIFY_SECRET` = `HARBOR_SSO_VERIFY_SECRET`
2. Keep these unique:
- `RESUME_SSO_SIGNING_KEY`
- `HARBOR_SSO_PASSWORD_SECRET`
3. Optional:
- `RESUME_SSO_LINK_SECRET` unique (or same as verify for now)

So minimum good setup is 3 unique secrets total, with 1 shared pair for verify.