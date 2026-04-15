import { NextRequest, NextResponse } from 'next/server'

import { createResumeSsoToken } from '@/lib/auth/resume-sso'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getRequestId } from '@/lib/observability/request-id'

type InitBody = {
  returnPath?: string
}

function sanitizeReturnPath(value: string | undefined): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//')) return '/dashboard'
  return value
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getTtlSeconds(): number {
  const raw = process.env.RESUME_SSO_TOKEN_TTL_SECONDS
  const parsed = raw ? Number.parseInt(raw, 10) : 900

  if (!Number.isFinite(parsed)) return 900
  return Math.max(120, Math.min(1800, parsed))
}

async function writeAuditEvent(input: {
  harborUserId: string
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
      harbor_user_id: input.harborUserId,
      action: input.action,
      ip,
      user_agent: userAgent,
      metadata: input.metadata ?? {} })
  } catch {
    // Audit should not block auth flow.
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestId = getRequestId({ headers: request.headers })

    const resumeAppUrl = getRequiredEnv('RESUME_APP_URL')
    const signingKey = getRequiredEnv('RESUME_SSO_SIGNING_KEY')

    const supabase = await createClient()
    const {
      data: { session },
      error: authError } = await supabase.auth.getSession()

    const user = session?.user ?? null

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Phase 1 scope: student launch only.
    if (profile.user_type !== 'student') {
      return NextResponse.json({ error: 'Resume builder is currently enabled for students only' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as InitBody
    const returnPath = sanitizeReturnPath(body.returnPath)

    const { token, claims } = createResumeSsoToken({
      userId: profile.id,
      email: profile.email,
      name: profile.full_name ?? profile.email,
      role: profile.user_type,
      ttlSeconds: getTtlSeconds(),
      secret: signingKey })

    const launchUrl = new URL('/sso/launch', resumeAppUrl)
    launchUrl.searchParams.set('token', token)
    launchUrl.searchParams.set('returnPath', returnPath)
    launchUrl.searchParams.set('cid', requestId)

    await writeAuditEvent({
      harborUserId: profile.id,
      action: 'issue_token',
      metadata: { jti: claims.jti, exp: claims.exp },
      request })

    const response = NextResponse.json({
      launchUrl: launchUrl.toString(),
      expiresAt: new Date(claims.exp * 1000).toISOString(),
      tokenType: 'bearer' })
    response.headers.set('x-request-id', requestId)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resume-sso:init]', message)

    return NextResponse.json({ error: 'Failed to initialize SSO' }, { status: 500 })
  }
}
