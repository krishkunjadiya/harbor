import { NextResponse } from 'next/server'

import { getCurrentUserProfile, getFaculty } from '@/lib/actions/database'

type AdminFacultyPayload = {
  faculty: any[]
}

const ADMIN_FACULTY_CACHE_TTL_MS = 60_000

const adminFacultyCache = new Map<string, { expiresAt: number; value: AdminFacultyPayload }>()

function readAdminFacultyCache(userId: string) {
  const entry = adminFacultyCache.get(userId)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    adminFacultyCache.delete(userId)
    return null
  }

  return entry.value
}

function writeAdminFacultyCache(userId: string, value: AdminFacultyPayload) {
  adminFacultyCache.set(userId, {
    value,
    expiresAt: Date.now() + ADMIN_FACULTY_CACHE_TTL_MS,
  })
}

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile || profile.user_type !== 'university') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cached = readAdminFacultyCache(profile.id)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      })
    }

    const payload: AdminFacultyPayload = {
      faculty: (await getFaculty(profile.id)) || [],
    }

    writeAdminFacultyCache(profile.id, payload)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    })
  } catch (error) {
    console.error('[api/university/admin-faculty] Failed to load faculty:', error)
    return NextResponse.json({ error: 'Failed to load faculty' }, { status: 500 })
  }
}
