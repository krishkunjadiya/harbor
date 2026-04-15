import { NextResponse } from 'next/server'

import { getUniversityDashboard } from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

export async function GET() {
  try {
    const guard = await requireApiUserTypes(['university'])
    if (!guard.ok) {
      return guard.response
    }

    const dashboard = await getUniversityDashboard(guard.profile.id)
    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('[api/university/admin-dashboard] Failed to load dashboard:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
