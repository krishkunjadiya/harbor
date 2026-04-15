import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createResumeSsoToken } from '@/lib/auth/resume-sso'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getTtlSeconds(): number {
  const raw = process.env.RESUME_SSO_TOKEN_TTL_SECONDS
  const parsed = raw ? Number.parseInt(raw, 10) : 900

  if (!Number.isFinite(parsed)) return 900
  return Math.max(120, Math.min(1800, parsed))
}

export default async function StudentResumeBuilderLaunchPage() {
  const resumeAppUrl = process.env.RESUME_APP_URL
  const signingKey = process.env.RESUME_SSO_SIGNING_KEY

  if (!resumeAppUrl || !signingKey) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Unable to Open Resume Builder</CardTitle>
            <CardDescription>SSO launch failed. Please verify resume SSO environment settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/student/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { session },
    error: authError } = await supabase.auth.getSession()

  const user = session?.user ?? null

  if (authError || !user) {
    redirect('/login')
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

  // Fast path uses session metadata. Fallback to DB only when role/name is missing.
  if (!profile.email || !profile.user_type) {
    const { data: dbProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !dbProfile) {
      redirect('/student/dashboard')
    }

    profile = dbProfile
  }

  if (profile.user_type !== 'student') {
    redirect('/student/dashboard')
  }

  const { token } = createResumeSsoToken({
    userId: profile.id,
    email: profile.email,
    name: profile.full_name ?? profile.email,
    role: profile.user_type,
    ttlSeconds: getTtlSeconds(),
    secret: signingKey })

  const launchUrl = new URL('/sso/launch', resumeAppUrl)
  launchUrl.searchParams.set('token', token)
  launchUrl.searchParams.set('returnPath', '/dashboard')

  redirect(launchUrl.toString())
}
