import { NextResponse } from 'next/server'
import { createResumeSsoToken } from '@/lib/auth/resume-sso'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Deterministic, one-time launch assertion for Resume Builder v2
  const supabase = await createClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (authError || !session || userError || !user) {
    return NextResponse.redirect('/login')
  }

  const metadata = user.user_metadata ?? {}
  const profile = {
    id: user.id,
    email: user.email ?? '',
    full_name: metadata.full_name ?? metadata.name ?? user.email ?? '',
    user_type: typeof metadata.user_type === 'string' ? metadata.user_type : '',
  }

  if (!profile.email || profile.user_type !== 'student') {
    return NextResponse.redirect('/student/dashboard')
  }

  const signingKey = process.env.RESUME_SSO_SIGNING_KEY
  const resumeAppUrl = process.env.RESUME_APP_URL
  if (!signingKey || !resumeAppUrl) {
    return NextResponse.json({ error: 'Resume SSO not configured' }, { status: 500 })
  }

  // Emit v2 token
  const { token } = createResumeSsoToken({
    userId: profile.id,
    email: profile.email,
    name: profile.full_name,
    role: profile.user_type,
    ttlSeconds: 180,
    version: 2,
    secret: signingKey,
  })

  // Return launch URL for client-side redirect
  const launchUrl = new URL('/sso/launch', resumeAppUrl)
  launchUrl.searchParams.set('token', token)
  launchUrl.searchParams.set('returnPath', '/dashboard')

  return NextResponse.json({ launchUrl: launchUrl.toString() })
}
