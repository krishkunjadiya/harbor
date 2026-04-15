import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

import { auth } from "@/integrations/auth/config";
import { db } from "@/integrations/drizzle/client";
import { account, resume, user } from "@/integrations/drizzle/schema";
import { env } from "@/utils/env";
import { hashPassword } from "@/utils/password";
import { getRequestId } from "@/utils/request-id";
import { and, desc, eq } from "drizzle-orm";

type HarborVerifySuccess = {
  valid: true;
  harborUser: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

type HarborVerifyFailure = {
  error?: string;
};

type ResumeSsoClaims = {
  iss: "harbor";
  aud: "reactive_resume";
  sub: string;
  email: string;
  name: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
};

const TOKEN_CLOCK_SKEW_SECONDS = 300;

export const Route = createFileRoute("/sso/launch")({
  server: { handlers: { GET: handler } },
});


function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function verifyResumeSsoTokenLocally(token: string, secret: string): HarborVerifySuccess["harborUser"] {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(signingInput, secret);

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("Invalid token signature");
  }

  let claims: ResumeSsoClaims;

  try {
    claims = JSON.parse(fromBase64Url(encodedPayload)) as ResumeSsoClaims;
  } catch {
    throw new Error("Invalid token encoding");
  }

  if (claims.iss !== "harbor" || claims.aud !== "reactive_resume") {
    throw new Error("Invalid token claims");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || now > claims.exp + TOKEN_CLOCK_SKEW_SECONDS) {
    throw new Error("Token expired");
  }

  if (!claims.sub || !claims.email || !claims.name || !claims.role) {
    throw new Error("Incomplete token claims");
  }

  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    role: claims.role,
  };
}

function sanitizeReturnPath(path: string | null): string {
  if (!path || !path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard";
  return path;
}

function createSsoUsername(harborUserId: string): string {
  const compact = harborUserId.replaceAll("-", "").toLowerCase();
  return `harbor_${compact.slice(0, 24)}`;
}

function getSsoPasswordSecret(): string {
  return env.HARBOR_SSO_PASSWORD_SECRET ?? env.HARBOR_SSO_SIGNING_KEY ?? env.HARBOR_SSO_VERIFY_SECRET ?? "harbor-sso-dev-secret";
}

function createDeterministicSsoPassword(harborUserId: string): string {
  const digest = createHmac("sha256", getSsoPasswordSecret()).update(harborUserId).digest("base64url");
  return `Hr_${digest.slice(0, 40)}_9!`;
}

function getSetCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function ensureCredentialAccount(input: {
  resumeUserId: string;
  password: string;
}) {
  const [credentialAccount] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, input.resumeUserId), eq(account.providerId, "credential")))
    .limit(1);

  const passwordHash = await hashPassword(input.password);

  if (credentialAccount?.id) {
    await db
      .update(account)
      .set({
        accountId: input.resumeUserId,
        password: passwordHash,
      })
      .where(eq(account.id, credentialAccount.id));
    return;
  }

  await db.insert(account).values({
    userId: input.resumeUserId,
    providerId: "credential",
    accountId: input.resumeUserId,
    password: passwordHash,
  });
}

async function signInForSso(input: {
  request: Request;
  username: string;
  email: string;
  password: string;
}): Promise<Headers> {
  const signInUsername = (auth.api as unknown as Record<string, unknown>).signInUsername as
    | ((context: {
      body: { username: string; password: string; rememberMe?: boolean };
      headers?: Headers;
      asResponse?: boolean;
    }) => Promise<Response>)
    | undefined;

  if (signInUsername) {
    const response = await signInUsername({
      body: {
        username: input.username,
        password: input.password,
        rememberMe: true,
      },
      headers: new Headers(input.request.headers),
      asResponse: true,
    });

    if (response.ok) {
      return response.headers;
    }
  }

  const signInEmail = auth.api.signInEmail as (context: {
    body: { email: string; password: string; rememberMe?: boolean };
    headers?: Headers;
    asResponse?: boolean;
  }) => Promise<Response>;

  const response = await signInEmail({
    body: {
      email: input.email,
      password: input.password,
      rememberMe: true,
    },
    headers: new Headers(input.request.headers),
    asResponse: true,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to establish SSO session (${response.status}) ${text}`);
  }

  return response.headers;
}




async function verifyWithHarbor(token: string): Promise<HarborVerifySuccess> {
  if (!env.HARBOR_SSO_VERIFY_URL || !env.HARBOR_SSO_VERIFY_SECRET) {
    throw new Error("Harbor SSO verification is not configured");
  }

  const response = await fetch(env.HARBOR_SSO_VERIFY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.HARBOR_SSO_VERIFY_SECRET}`,
    },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await response.json().catch(() => ({}))) as HarborVerifySuccess | HarborVerifyFailure;

  if (!response.ok || !("valid" in body) || !body.valid) {
    throw new Error(("error" in body && body.error) || "Harbor verification failed");
  }

  return body;
}

async function resolveHarborUser(token: string): Promise<HarborVerifySuccess["harborUser"]> {
  if (env.HARBOR_SSO_SIGNING_KEY) {
    return verifyResumeSsoTokenLocally(token, env.HARBOR_SSO_SIGNING_KEY);
  }

  const verification = await verifyWithHarbor(token);
  return verification.harborUser;
}


async function linkUsersWithHarbor(input: { harborUserId: string; resumeUserId: string }) {
  const linkSecret = env.HARBOR_SSO_LINK_SECRET ?? env.HARBOR_SSO_VERIFY_SECRET;

  if (!env.HARBOR_SSO_LINK_URL || !linkSecret) {
    return;
  }

  try {
    const response = await fetch(env.HARBOR_SSO_LINK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${linkSecret}`,
      },
      body: JSON.stringify({
        harborUserId: input.harborUserId,
        resumeUserId: input.resumeUserId,
        status: "active",
      }),
      signal: AbortSignal.timeout(1200),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[sso/launch] harbor link failed", { status: response.status, text });
    }
  } catch {
    // Best-effort link sync; never block or spam logs for network glitches.
  }
}


async function handler({ request }: { request: Request }) {
  const requestId = getRequestId({ headers: new Headers(request.headers) })

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const returnPath = sanitizeReturnPath(url.searchParams.get("returnPath"));

    console.info("[sso/launch] start", { requestId, returnPath });

    if (!token) {
      console.warn("[sso/launch] missing_token", { requestId });
      return new Response("Missing token", { status: 400 });
    }

    const harborUser = await resolveHarborUser(token);

    if (harborUser.role !== "student") {
      console.warn("[sso/launch] invalid_role", { requestId, role: harborUser.role });
      return new Response("Invalid role", { status: 403 });
    }

    // Parse token version for v2 contract
    let tokenVersion = 1;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (payload.ver === 2) tokenVersion = 2;
      }
    } catch {}

    const username = createSsoUsername(harborUser.id);

    // v2: Only idempotent user mapping and session setup, no fallback sign-in/sign-up
    if (tokenVersion === 2) {
      // Upsert user if not exists
      let resumeUserId: string | undefined;
      const [existingResumeUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, harborUser.email)).limit(1);
      if (existingResumeUser?.id) {
        resumeUserId = existingResumeUser.id;
      } else {
        // Create user (idempotent)
        const inserted = await db.insert(user).values({
          email: harborUser.email,
          name: harborUser.name,
          username,
          displayUsername: username,
        }).onConflictDoNothing().returning({ id: user.id });
        resumeUserId = inserted[0]?.id;
      }

      if (resumeUserId) {
        const ssoPassword = createDeterministicSsoPassword(harborUser.id);

        await ensureCredentialAccount({
          resumeUserId,
          password: ssoPassword,
        });

        const signInHeaders = await signInForSso({
          request,
          username,
          email: harborUser.email,
          password: ssoPassword,
        });

        void linkUsersWithHarbor({
          harborUserId: harborUser.id,
          resumeUserId,
        });

        let finalReturnPath = returnPath;
        if (finalReturnPath === "/dashboard") {
          const [latestResume] = await db
            .select({ id: resume.id })
            .from(resume)
            .where(eq(resume.userId, resumeUserId))
            .orderBy(desc(resume.updatedAt))
            .limit(1);
          finalReturnPath = latestResume ? `/builder/${latestResume.id}` : "/dashboard/resumes";
        }

        // Trusted launch must set auth cookies before redirecting to protected routes.
        console.info("[sso/launch] v2_redirect", { requestId, finalReturnPath, resumeUserId: Boolean(resumeUserId) });
        const response = Response.redirect(new URL(finalReturnPath, env.APP_URL), 302);

        for (const cookie of getSetCookieHeaders(signInHeaders)) {
          response.headers.append("set-cookie", cookie);
        }

        response.headers.set("x-request-id", requestId);
        return response;
      }

      console.warn("[sso/launch] missing_resume_user_after_upsert", { requestId });
      return Response.redirect(new URL("/auth/login", env.APP_URL), 302);
    }

    console.warn("[sso/launch] unsupported_contract", { requestId, tokenVersion });
    return new Response("Unsupported launch contract", { status: 426 });
  } catch (error) {
    console.error("[sso/launch]", { requestId, error });
    return Response.redirect(new URL("/auth/login", env.APP_URL), 302);
  }
}
