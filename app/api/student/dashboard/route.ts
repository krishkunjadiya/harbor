import { NextResponse } from 'next/server'

import { getStudentDashboard } from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

export async function GET() {
  try {
    const guard = await requireApiUserTypes(['student'])
    if (!guard.ok) {
      return guard.response
    }

    const dashboard = await getStudentDashboard(guard.profile.id)
    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('[api/student/dashboard] Failed to load dashboard:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
