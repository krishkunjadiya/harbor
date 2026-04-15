import { NextResponse } from 'next/server'

import { getRecruiterDashboard } from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

export async function GET() {
  try {
    const guard = await requireApiUserTypes(['recruiter'])
    if (!guard.ok) {
      return guard.response
    }

    const dashboard = await getRecruiterDashboard(guard.profile.id)
    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('[api/recruiter/dashboard] Failed to load dashboard:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
