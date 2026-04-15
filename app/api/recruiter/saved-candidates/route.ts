import { NextResponse } from 'next/server'

import { getSavedCandidates } from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

export async function GET() {
  try {
    const authResult = await requireApiUserTypes(['recruiter'])
    if (!authResult.ok) {
      return authResult.response
    }

    const candidates = await getSavedCandidates(authResult.profile.id)
    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('[api/recruiter/saved-candidates] Failed to load candidates:', error)
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}
