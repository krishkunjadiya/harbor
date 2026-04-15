import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

type LinkBody = {
  harborUserId?: string
  resumeUserId?: string
  status?: string
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isCallerAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.RESUME_SSO_LINK_SECRET ?? process.env.RESUME_SSO_VERIFY_SECRET
  if (!expectedSecret) return false

  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, token] = authorization.split(' ')

  return scheme === 'Bearer' && token === expectedSecret
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
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
    // Audit should not block SSO flow.
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isCallerAuthorized(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as LinkBody

    if (!body.harborUserId || !body.resumeUserId) {
      return NextResponse.json({ error: 'Missing harborUserId or resumeUserId' }, { status: 400 })
    }

    if (!isUuid(body.harborUserId) || !isUuid(body.resumeUserId)) {
      return NextResponse.json({ error: 'Invalid user id format' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('resume_user_links')
      .upsert(
        {
          harbor_user_id: body.harborUserId,
          resume_user_id: body.resumeUserId,
          status: body.status ?? 'active',
          updated_at: new Date().toISOString() },
        { onConflict: 'harbor_user_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await writeAuditEvent({
      harborUserId: body.harborUserId,
      action: 'link_created',
      metadata: { resumeUserId: body.resumeUserId },
      request })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[resume-sso:link]', message)

    return NextResponse.json({ error: 'Failed to link users' }, { status: 500 })
  }
}
