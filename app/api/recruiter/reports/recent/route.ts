import { NextResponse } from 'next/server'

import { requireApiUserTypes } from '@/lib/auth/api-guards'
import { getRecentReports } from '@/lib/actions/reports'

export async function GET() {
  try {
    const authResult = await requireApiUserTypes(['recruiter'])
    if (!authResult.ok) {
      return authResult.response
    }

    const recentReports = await getRecentReports(authResult.profile.id)
    return NextResponse.json({ recentReports })
  } catch (error) {
    console.error('[api/recruiter/reports/recent] Failed to load reports:', error)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}
