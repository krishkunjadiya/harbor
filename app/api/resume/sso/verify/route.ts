import { NextRequest, NextResponse } from 'next/server'

import { verifyResumeSsoToken } from '@/lib/auth/resume-sso'
import { createAdminClient } from '@/lib/supabase/admin'

type VerifyBody = {
  token?: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function isCallerAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.RESUME_SSO_VERIFY_SECRET
  if (!expectedSecret) return false

  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, token] = authorization.split(' ')

  return scheme === 'Bearer' && token === expectedSecret
}


async function markJtiAsConsumed(input: { jti: string; exp: number; harborUserId: string }): Promise<boolean> {
  const admin = createAdminClient()

  // Keep the replay table bounded by removing expired rows opportunistically.
  await admin
    .from('resume_sso_consumed_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())

  const { error } = await admin.from('resume_sso_consumed_tokens').insert({
    jti: input.jti,
    harbor_user_id: input.harborUserId,
    expires_at: new Date(input.exp * 1000).toISOString() })

  if (!error) {
    return true
  }

  // Postgres unique_violation -> token replay.
  if (error.code === '23505') {
    return false
  }

  throw new Error(`Failed to persist consumed token: ${error.message}`)
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
    if (!isCallerAuthorized(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const signingKey = getRequiredEnv('RESUME_SSO_SIGNING_KEY')
    const body = (await request.json().catch(() => ({}))) as VerifyBody

    if (!body.token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const claims = verifyResumeSsoToken(body.token, signingKey)

    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name, user_type')
      .eq('id', claims.sub)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (profile.user_type !== 'student') {
      return NextResponse.json({ error: 'Invalid role for resume launch' }, { status: 403 })
    }

    const consumed = await markJtiAsConsumed({
      jti: claims.jti,
      exp: claims.exp,
      harborUserId: profile.id })

    if (!consumed) {
      return NextResponse.json({ error: 'Token replay detected' }, { status: 409 })
    }

    await writeAuditEvent({
      harborUserId: profile.id,
      action: 'verify_token',
      metadata: { jti: claims.jti },
      request })

    return NextResponse.json({
      valid: true,
      harborUser: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name ?? profile.email,
        role: profile.user_type } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resume-sso:verify]', message)

    return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
  }
}
