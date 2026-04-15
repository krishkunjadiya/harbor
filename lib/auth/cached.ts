import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

/**
 * Per-request cached auth helpers.
 *
 * React `cache()` deduplicates calls within a single server-component render
 * tree, so no matter how many server components call `getAuthUser()` in the
 * same request they'll only trigger ONE Supabase `getUser()` round-trip.
 *
 * Security note: these still use `getUser()` (server-verified) — not the
 * unverified `getSession()` — so they are safe for data-fetching decisions.
 */

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return profile as Profile
})
