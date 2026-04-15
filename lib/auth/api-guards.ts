import { NextResponse } from 'next/server'

import { getCurrentProfile } from '@/lib/auth/cached'
import type { Profile, UserType } from '@/lib/types/database'

type ApiGuardResult =
  | { ok: true; profile: Profile }
  | { ok: false; response: NextResponse }

export async function requireApiUserTypes(allowedUserTypes: UserType[]): Promise<ApiGuardResult> {
  const profile = await getCurrentProfile()

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (!allowedUserTypes.includes(profile.user_type)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, profile }
}