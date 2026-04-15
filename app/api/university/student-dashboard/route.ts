import { NextResponse } from 'next/server'

import { getUniversityDashboard, getUniversityStudentDashboardData } from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

type UniversityStudentDashboardPayload = {
  data: any
}

const UNIVERSITY_STUDENT_DASHBOARD_CACHE_TTL_MS = 60_000

const universityStudentDashboardCache = new Map<string, { expiresAt: number; value: UniversityStudentDashboardPayload }>()

function readUniversityStudentDashboardCache(cacheKey: string) {
  const entry = universityStudentDashboardCache.get(cacheKey)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    universityStudentDashboardCache.delete(cacheKey)
    return null
  }

  return entry.value
}

function writeUniversityStudentDashboardCache(cacheKey: string, value: UniversityStudentDashboardPayload) {
  universityStudentDashboardCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + UNIVERSITY_STUDENT_DASHBOARD_CACHE_TTL_MS,
  })
}

export async function GET(request: Request) {
  try {
    const guard = await requireApiUserTypes(['university'])
    if (!guard.ok) {
      return guard.response
    }

    const searchParams = new URL(request.url).searchParams
    const scope = searchParams.get('scope') === 'full' ? 'full' : 'overview'
    const cacheKey = `${guard.profile.id}:${scope}`

    const cached = readUniversityStudentDashboardCache(cacheKey)
    if (cached) {
      return NextResponse.json(
        cached,
        { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
      )
    }

    let data: any
    if (scope === 'full') {
      data = await getUniversityStudentDashboardData(guard.profile.id)
    } else {
      const dashboard = await getUniversityDashboard(guard.profile.id)
      data = {
        totalStudents: dashboard?.stats?.total_students || 0,
        activeEnrollments: 0,
        averagePerformance: 0,
        recentEnrollments: [],
        topPerformers: [],
        departmentBreakdown: [],
        departmentCards: [],
        gpaDistribution: [],
        enrollmentTrends: [],
        graduationRates: [],
        semesterPerformance: [],
      }
    }

    const payload: UniversityStudentDashboardPayload = { data }

    writeUniversityStudentDashboardCache(cacheKey, payload)

    return NextResponse.json(
      payload,
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('[api/university/student-dashboard] Failed to load dashboard:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
