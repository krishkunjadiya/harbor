import { NextRequest, NextResponse } from 'next/server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { createResumeSsoToken } from '@/lib/auth/resume-sso'
import { getRequestId } from '@/lib/observability/request-id'
import { createAdminClient } from '@/lib/supabase/admin'

type PasswordLoginBody = {
  email?: string
  password?: string
  returnPath?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function sanitizeReturnPath(value: string | undefined): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//')) return '/dashboard'
  return value
}

function isCallerAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.RESUME_SSO_VERIFY_SECRET
  if (!expectedSecret) return false

  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, token] = authorization.split(' ')

  return scheme === 'Bearer' && token === expectedSecret
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
      metadata: input.metadata ?? {},
    })
  } catch {
    // Audit should not block auth flow.
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestId = getRequestId({ headers: request.headers })

    if (!isCallerAuthorized(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as PasswordLoginBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const returnPath = sanitizeReturnPath(body.returnPath)

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const signingKey = getRequiredEnv('RESUME_SSO_SIGNING_KEY')

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name, user_type')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type !== 'student') {
      return NextResponse.json({ error: 'Only student accounts can use resume builder' }, { status: 403 })
    }

    const { token, claims } = createResumeSsoToken({
      userId: profile.id,
      email: profile.email,
      name: profile.full_name ?? profile.email,
      role: profile.user_type,
      ttlSeconds: getTtlSeconds(),
      version: 2,
      secret: signingKey,
    })

    await writeAuditEvent({
      harborUserId: profile.id,
      action: 'password_login_issue_token',
      metadata: { requestId, jti: claims.jti, exp: claims.exp },
      request,
    })

    const response = NextResponse.json({
      token,
      returnPath,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    })
    response.headers.set('x-request-id', requestId)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resume-sso:password-login]', message)

    return NextResponse.json({ error: 'Failed to sign in with Harbor credentials' }, { status: 500 })
  }
}
