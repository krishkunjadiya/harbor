import { NextResponse } from 'next/server'

import { getCurrentUserProfile, getJobApplications } from '@/lib/actions/database'

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (profile.user_type !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const applications = await getJobApplications(profile.id)

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('[api/student/applications] Failed to load applications:', error)
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 })
  }
}
