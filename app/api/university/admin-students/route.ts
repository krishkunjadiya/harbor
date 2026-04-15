import { NextResponse } from 'next/server'

import { getCurrentUserProfile, getUniversityProfile } from '@/lib/actions/database'
import { createClient } from '@/lib/supabase/server'

type AdminStudentsPayload = {
  students: any[]
}

const ADMIN_STUDENTS_CACHE_TTL_MS = 60_000

const adminStudentsCache = new Map<string, { expiresAt: number; value: AdminStudentsPayload }>()

function readAdminStudentsCache(userId: string) {
  const entry = adminStudentsCache.get(userId)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    adminStudentsCache.delete(userId)
    return null
  }

  return entry.value
}

function writeAdminStudentsCache(userId: string, value: AdminStudentsPayload) {
  adminStudentsCache.set(userId, {
    value,
    expiresAt: Date.now() + ADMIN_STUDENTS_CACHE_TTL_MS,
  })
}

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile || profile.user_type !== 'university') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cached = readAdminStudentsCache(profile.id)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      })
    }

    const universityProfile = await getUniversityProfile(profile.id)
    const universityName = universityProfile?.university_name || universityProfile?.universities?.university_name

    if (!universityName) {
      const emptyPayload: AdminStudentsPayload = { students: [] }
      writeAdminStudentsCache(profile.id, emptyPayload)
      return NextResponse.json(emptyPayload)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        profile_id,
        university,
        major,
        program,
        graduation_year,
        gpa,
        profiles(id, full_name, email, avatar_url)
      `)
      .eq('university', universityName)
      .order('resume_score', { ascending: false, nullsFirst: false })
      .limit(200)

    if (error) {
      console.error('[api/university/admin-students] Failed query:', error)
      return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
    }

    const payload: AdminStudentsPayload = { students: data || [] }
    writeAdminStudentsCache(profile.id, payload)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    })
  } catch (error) {
    console.error('[api/university/admin-students] Failed to load students:', error)
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
  }
}
