import { NextResponse } from 'next/server'

import {
  getAssignmentCompletionRates,
  getCourseGradeStatistics,
  getFacultyDashboard,
} from '@/lib/actions/database'
import { requireApiUserTypes } from '@/lib/auth/api-guards'

type FacultyDashboardPayload = {
  dashboardData: any
  gradeStatistics: any[]
  completionRates: any[]
}

type DashboardScope = 'overview' | 'full'

const FACULTY_DASHBOARD_CACHE_TTL_MS = 60_000

const facultyDashboardCache = new Map<string, { expiresAt: number; value: FacultyDashboardPayload }>()

function readFacultyDashboardCache(cacheKey: string) {
  const entry = facultyDashboardCache.get(cacheKey)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    facultyDashboardCache.delete(cacheKey)
    return null
  }

  return entry.value
}

function writeFacultyDashboardCache(cacheKey: string, value: FacultyDashboardPayload) {
  facultyDashboardCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + FACULTY_DASHBOARD_CACHE_TTL_MS,
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

    const cached = readFacultyDashboardCache(cacheKey)
    if (cached) {
      return NextResponse.json(
        cached,
        { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
      )
    }

    const dashboardData = await getFacultyDashboard(guard.profile.id)

    let grades: any[] = []
    let completion: any[] = []
    const hasCourseContext = Array.isArray(dashboardData?.courses) && dashboardData.courses.length > 0
    const shouldLoadFullAnalytics: boolean = scope === 'full' && hasCourseContext
    if (shouldLoadFullAnalytics) {
      const [gradeData, completionData] = await Promise.all([
        getCourseGradeStatistics(guard.profile.id),
        getAssignmentCompletionRates(guard.profile.id),
      ])
      grades = gradeData || []
      completion = completionData || []
    }

    const payload: FacultyDashboardPayload = {
      dashboardData,
      gradeStatistics: grades,
      completionRates: completion,
    }

    writeFacultyDashboardCache(cacheKey, payload)

    return NextResponse.json(
      payload,
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('[api/university/faculty-dashboard] Failed to load dashboard:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
