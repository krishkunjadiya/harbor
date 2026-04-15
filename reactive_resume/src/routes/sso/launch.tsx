import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@/integrations/drizzle/client";
import { account, resume, user } from "@/integrations/drizzle/schema";
import { auth } from "@/integrations/auth/config";
import { env } from "@/utils/env";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { hashPassword } from "@/utils/password";

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

const SIGN_IN_ENDPOINTS = ["/api/auth/sign-in/email", "/api/auth/sign-in"];
const SIGN_UP_ENDPOINTS = ["/api/auth/sign-up/email", "/api/auth/sign-up"];

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

function createSsoPassword(harborUserId: string): string {
  const secret = env.HARBOR_SSO_PASSWORD_SECRET ?? env.AUTH_SECRET;

  const digest = createHmac("sha256", secret).update(`harbor-sso:${harborUserId}`).digest("hex");

  return `Hrbr!${digest.slice(0, 48)}`;
}

async function callAuth(path: string, payload: Record<string, unknown>): Promise<Response> {
  const request = new Request(new URL(path, env.APP_URL).toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return auth.handler(request);
}

async function tryAuth(paths: string[], payload: Record<string, unknown>): Promise<Response | null> {
  for (const path of paths) {
    const response = await callAuth(path, payload);

    // 2xx or redirect indicates the endpoint exists and handled the request.
    if (response.status < 400) {
      return response;
    }

    // If endpoint path does not exist, try the next fallback path.
    if (response.status === 404) {
      continue;
    }

    // Endpoint exists but auth failed (e.g., bad credentials / already exists).
    return response;
  }

  return null;
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

function copySessionCookies(source: Response, target: Response) {
  const getSetCookie = (source.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;

  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie.call(source.headers)) {
      target.headers.append("set-cookie", cookie);
    }

    return;
  }

  const setCookie = source.headers.get("set-cookie");
  if (setCookie) {
    // Fallback for environments without getSetCookie().
    target.headers.append("set-cookie", setCookie);
  }
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

async function syncCredentialPasswordForUser(input: { email: string; password: string }): Promise<boolean> {
  const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, input.email)).limit(1);

  if (!existingUser?.id) {
    return false;
  }

  const [credentialAccount] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, existingUser.id),
        or(
          inArray(account.providerId, ["credential", "email", "email-password"]),
          eq(account.accountId, input.email),
        ),
      ),
    )
    .limit(1);

  if (!credentialAccount?.id) {
    return false;
  }

  const hashedPassword = await hashPassword(input.password);

  await db
    .update(account)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(account.id, credentialAccount.id));

  return true;
}

async function handler({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const returnPath = sanitizeReturnPath(url.searchParams.get("returnPath"));

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const harborUser = await resolveHarborUser(token);

    if (harborUser.role !== "student") {
      return new Response("Invalid role", { status: 403 });
    }

    const password = createSsoPassword(harborUser.id);
    const username = createSsoUsername(harborUser.id);

    const [existingResumeUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, harborUser.email)).limit(1);

    let signInResponse: Response | null = null;

    if (existingResumeUser?.id) {
      signInResponse = await tryAuth(SIGN_IN_ENDPOINTS, {
        email: harborUser.email,
        password,
        rememberMe: true,
      });

      if (!signInResponse || signInResponse.status >= 400) {
        const synced = await syncCredentialPasswordForUser({
          email: harborUser.email,
          password,
        });

        if (synced) {
          signInResponse = await tryAuth(SIGN_IN_ENDPOINTS, {
            email: harborUser.email,
            password,
            rememberMe: true,
          });
        }
      }
    } else {
      const signUpResponse = await tryAuth(SIGN_UP_ENDPOINTS, {
        name: harborUser.name,
        email: harborUser.email,
        username,
        displayUsername: username,
        password,
      });

      if (signUpResponse && signUpResponse.status < 400) {
        signInResponse = signUpResponse;
      } else {
        signInResponse = await tryAuth(SIGN_IN_ENDPOINTS, {
          email: harborUser.email,
          password,
          rememberMe: true,
        });
      }
    }

    if (!signInResponse || signInResponse.status >= 400) {
      console.error("[sso/launch] failed to establish session", {
        status: signInResponse?.status,
        userId: harborUser.id,
      });

      return new Response("Unable to establish session", { status: 401 });
    }

    const [resumeUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, harborUser.email))
      .limit(1);

    if (resumeUser?.id) {
      void linkUsersWithHarbor({
        harborUserId: harborUser.id,
        resumeUserId: resumeUser.id,
      });
    }

    let finalReturnPath = returnPath;

    if (finalReturnPath === "/dashboard" && resumeUser?.id) {
      const [latestResume] = await db
        .select({ id: resume.id })
        .from(resume)
        .where(eq(resume.userId, resumeUser.id))
        .orderBy(desc(resume.updatedAt))
        .limit(1);

      finalReturnPath = latestResume ? `/builder/${latestResume.id}` : "/dashboard/resumes";
    }

    const redirectResponse = new Response(null, {
      status: 302,
      headers: { location: new URL(finalReturnPath, env.APP_URL).toString() },
    });
    copySessionCookies(signInResponse, redirectResponse);

    return redirectResponse;
  } catch (error) {
    console.error("[sso/launch]", error);
    return Response.redirect(new URL("/auth/login", env.APP_URL), 302);
  }
}
