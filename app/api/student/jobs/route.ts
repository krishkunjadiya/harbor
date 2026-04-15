import { NextResponse } from 'next/server'

import { getActiveJobs, getCurrentUserProfile, getJobApplications } from '@/lib/actions/database'

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (profile.user_type !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [jobs, applications] = await Promise.all([
      getActiveJobs(),
      getJobApplications(profile.id),
    ])

    return NextResponse.json({
      jobs,
      applicationCount: applications.length,
      savedCount: 0,
    })
  } catch (error) {
    console.error('[api/student/jobs] Failed to load jobs:', error)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}
