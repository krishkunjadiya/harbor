import { NextRequest, NextResponse } from 'next/server'

import { createResumeSsoToken } from '@/lib/auth/resume-sso'
import { getRequestId } from '@/lib/observability/request-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function sanitizeReturnPath(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//')) return '/dashboard'
  return value
}

function getTtlSeconds(): number {
  const raw = process.env.RESUME_SSO_TOKEN_TTL_SECONDS
  const parsed = raw ? Number.parseInt(raw, 10) : 900

  if (!Number.isFinite(parsed)) return 900
  return Math.max(120, Math.min(1800, parsed))
}

function isUnifiedOriginEnabled(): boolean {
  return process.env.RESUME_USE_UNIFIED_ORIGIN === 'true'
}

async function writeAuditEvent(input: {
  harborUserId?: string | null
  action: string
  metadata?: Record<string, unknown>
  request: NextRequest
}) {
  try {
    const admin = createAdminClient()

    const xff = input.request.headers.get('x-forwarded-for')
    const ip = xff?.split(',')[0]?.trim() ?? null
    const userAgent = input.request.headers.get('user-agent')

    await admin.from('resume_sso_audit').insert({
      harbor_user_id: input.harborUserId ?? null,
      action: input.action,
      ip,
      user_agent: userAgent,
      metadata: input.metadata ?? {},
    })
  } catch {
    // Audit should never block launch.
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId({ headers: request.headers })
  const launchStartedAt = Date.now()
  const logLaunch = (stage: string, metadata?: Record<string, unknown>) => {
    console.info('[resume-launch:bff]', {
      requestId,
      stage,
      elapsedMs: Date.now() - launchStartedAt,
      ...(metadata ?? {}),
    })
  }

  try {
    logLaunch('start')

    const resumeAppUrl = process.env.RESUME_APP_URL
    const signingKey = process.env.RESUME_SSO_SIGNING_KEY
    const returnPath = sanitizeReturnPath(request.nextUrl.searchParams.get('returnPath'))

    if (!resumeAppUrl || !signingKey) {
      logLaunch('missing_env', {
        hasResumeAppUrl: Boolean(resumeAppUrl),
        hasSigningKey: Boolean(signingKey),
      })

      await writeAuditEvent({
        action: 'launch_failure',
        metadata: {
          requestId,
          reason: 'missing_env',
          elapsedMs: Date.now() - launchStartedAt,
        },
        request,
      })

      return NextResponse.json({ error: 'Resume launch is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    logLaunch('session_checked', {
      hasSession: Boolean(session),
      hasAuthError: Boolean(authError),
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (authError || userError || !user) {
      logLaunch('redirect_login')

      await writeAuditEvent({
        action: 'launch_failure',
        metadata: {
          requestId,
          reason: 'unauthorized',
          elapsedMs: Date.now() - launchStartedAt,
        },
        request,
      })

      return NextResponse.redirect(new URL('/login', request.url))
    }

    const metadata = user.user_metadata ?? {}
    const metadataRole = typeof metadata.user_type === 'string' ? metadata.user_type : undefined
    const metadataName = typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : undefined

    let profile = {
      id: user.id,
      email: user.email ?? '',
      full_name: metadataName ?? user.email ?? '',
      user_type: metadataRole ?? '',
    }

    if (!profile.email || !profile.user_type) {
      logLaunch('profile_fallback_query_start')

      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type')
        .eq('id', user.id)
        .single()

      logLaunch('profile_fallback_query_end', {
        foundProfile: Boolean(dbProfile),
        hasProfileError: Boolean(profileError),
      })

      if (profileError || !dbProfile) {
        logLaunch('redirect_dashboard_profile_missing')

        await writeAuditEvent({
          harborUserId: user.id,
          action: 'launch_failure',
          metadata: {
            requestId,
            reason: 'profile_missing',
            elapsedMs: Date.now() - launchStartedAt,
          },
          request,
        })

        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }

      profile = dbProfile
    }

    if (profile.user_type !== 'student') {
      logLaunch('redirect_dashboard_invalid_role', { role: profile.user_type })

      await writeAuditEvent({
        harborUserId: profile.id,
        action: 'launch_failure',
        metadata: {
          requestId,
          reason: 'invalid_role',
          role: profile.user_type,
          elapsedMs: Date.now() - launchStartedAt,
        },
        request,
      })

      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    const { token } = createResumeSsoToken({
      userId: profile.id,
      email: profile.email,
      name: profile.full_name ?? profile.email,
      role: profile.user_type,
      ttlSeconds: getTtlSeconds(),
      version: 2,
      secret: signingKey,
    })

    const legacyLaunchUrl = new URL('/sso/launch', resumeAppUrl)
    legacyLaunchUrl.searchParams.set('token', token)
    legacyLaunchUrl.searchParams.set('returnPath', returnPath)
    legacyLaunchUrl.searchParams.set('cid', requestId)

    const targetUrl = isUnifiedOriginEnabled()
      ? new URL('/resume/sso/launch', request.url)
      : legacyLaunchUrl

    targetUrl.searchParams.set('token', token)
    targetUrl.searchParams.set('returnPath', returnPath)
    targetUrl.searchParams.set('cid', requestId)

    logLaunch('redirect_resume_app', {
      unifiedOrigin: isUnifiedOriginEnabled(),
      targetHost: targetUrl.host,
      targetPath: targetUrl.pathname,
    })

    await writeAuditEvent({
      harborUserId: profile.id,
      action: 'launch_success',
      metadata: {
        requestId,
        unifiedOrigin: isUnifiedOriginEnabled(),
        targetPath: targetUrl.pathname,
        elapsedMs: Date.now() - launchStartedAt,
      },
      request,
    })

    const response = NextResponse.redirect(targetUrl)
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-resume-launch-id', requestId)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resume-launch:bff]', message)

    await writeAuditEvent({
      action: 'launch_failure',
      metadata: {
        requestId,
        reason: 'unexpected_error',
        message,
        elapsedMs: Date.now() - launchStartedAt,
      },
      request,
    })

    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }
}
