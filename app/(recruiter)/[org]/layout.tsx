import type React from 'react'
import { redirect } from 'next/navigation'

import { requireRouteUserType } from '@/lib/auth/route-context'
import { createClient } from '@/lib/supabase/server'

function toOrgSlug(value: string | null | undefined) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export default async function RecruiterOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ org: string }>
}) {
  const profile = await requireRouteUserType(['recruiter'])
  const { org } = await params

  const supabase = await createClient()
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('company_name, company')
    .eq('profile_id', profile.id)
    .maybeSingle()

  const expectedOrg = toOrgSlug(recruiter?.company_name || recruiter?.company)

  // Guard against opening recruiter routes under arbitrary org slugs.
  if (expectedOrg && expectedOrg !== org) {
    redirect(`/${expectedOrg}/dashboard`)
  }

  return <>{children}</>
}
