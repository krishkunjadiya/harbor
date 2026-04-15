import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/lib/auth/cached'
import type { Profile, UserType } from '@/lib/types/database'

export async function getRouteProfile(): Promise<Profile | null> {
  return getCurrentProfile()
}

export async function requireRouteProfile(redirectTo: string = '/login'): Promise<Profile> {
  const profile = await getRouteProfile()

  if (!profile) {
    redirect(redirectTo)
  }

  return profile
}

export async function requireRouteUserType(
  allowedUserTypes: UserType[],
  redirectTo: string = '/login'
): Promise<Profile> {
  const profile = await requireRouteProfile(redirectTo)

  if (!allowedUserTypes.includes(profile.user_type)) {
    redirect(redirectTo)
  }

  return profile
}