import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/utils/env";

type HarborLoginBody = {
  identifier?: string;
  password?: string;
  returnPath?: string;
};

type HarborLoginResponse = {
  token?: string;
  returnPath?: string;
  error?: string;
};

function sanitizeReturnPath(path: string | undefined): string {
  if (!path || !path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard";
  return path;
}

function resolveHarborPasswordLoginUrl(): URL | null {
  if (env.HARBOR_APP_URL) {
    return new URL("/api/resume/sso/password-login", env.HARBOR_APP_URL);
  }

  if (env.HARBOR_SSO_VERIFY_URL) {
    const origin = new URL(env.HARBOR_SSO_VERIFY_URL).origin;
    return new URL("/api/resume/sso/password-login", origin);
  }

  return null;
}

async function handler({ request }: { request: Request }) {
  const loginUrl = resolveHarborPasswordLoginUrl();

  if (!loginUrl || !env.HARBOR_SSO_VERIFY_SECRET) {
    return Response.json(
      {
        error: "Harbor credential bridge is not configured",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as HarborLoginBody;
  const identifier = body.identifier?.trim().toLowerCase();
  const password = body.password;
  const returnPath = sanitizeReturnPath(body.returnPath);

  if (!identifier || !password) {
    return Response.json({ error: "Missing identifier or password" }, { status: 400 });
  }

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.HARBOR_SSO_VERIFY_SECRET}`,
      },
      body: JSON.stringify({
        email: identifier,
        password,
        returnPath,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json().catch(() => ({}))) as HarborLoginResponse;

    if (!response.ok || !payload.token) {
      return Response.json(
        {
          error: payload.error ?? "Harbor credentials are invalid",
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 401 },
      );
    }

    const launchUrl = new URL("/sso/launch", env.APP_URL);
    launchUrl.searchParams.set("token", payload.token);
    launchUrl.searchParams.set("returnPath", sanitizeReturnPath(payload.returnPath ?? returnPath));

    return Response.json({ launchUrl: launchUrl.toString() }, { status: 200 });
  } catch {
    return Response.json({ error: "Failed to reach Harbor login bridge" }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/harbor-login")({
  server: {
    handlers: {
      POST: handler,
    },
  },
});
