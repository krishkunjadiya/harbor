import { NextResponse } from 'next/server'

import {
  getCurrentUserProfile,
  getUniversityDashboard,
  getUniversityStudentDashboardData,
} from '@/lib/actions/database'

type UniversityAdminInsights = {
  summary: {
    totalStudents: number
    totalFaculty: number
    totalDepartments: number
    credentialsIssued: number
    activeEnrollments: number
    averagePerformance: number
  }
  topPerformers: Array<{
    name: string
    gpa: number
    department: string
  }>
  departmentCards: Array<{
    name: string
    students: number
    avgGpa: number
    retention: number
  }>
  enrollmentTrends: Array<{
    year: string
    count: number
    change: string
  }>
  gpaDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  generatedAt: string
}

const INSIGHTS_CACHE_TTL_MS = 60_000

const insightsCache = new Map<string, { expiresAt: number; value: UniversityAdminInsights }>()

function readInsightsCache(userId: string) {
  const entry = insightsCache.get(userId)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    insightsCache.delete(userId)
    return null
  }

  return entry.value
}

function writeInsightsCache(userId: string, value: UniversityAdminInsights) {
  insightsCache.set(userId, {
    value,
    expiresAt: Date.now() + INSIGHTS_CACHE_TTL_MS,
  })
}

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (profile.user_type !== 'university') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cached = readInsightsCache(profile.id)
    if (cached) {
      return NextResponse.json(
        { insights: cached },
        { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
      )
    }

    const [dashboard, studentDashboard] = await Promise.all([
      getUniversityDashboard(profile.id),
      getUniversityStudentDashboardData(profile.id),
    ])

    const insights: UniversityAdminInsights = {
      summary: {
        totalStudents: dashboard?.stats?.total_students || 0,
        totalFaculty: dashboard?.stats?.total_faculty || 0,
        totalDepartments: dashboard?.stats?.total_departments || 0,
        credentialsIssued: dashboard?.stats?.credentials_issued || 0,
        activeEnrollments: studentDashboard?.activeEnrollments || 0,
        averagePerformance: studentDashboard?.averagePerformance || 0,
      },
      topPerformers: (studentDashboard?.topPerformers || []).slice(0, 5),
      departmentCards: (studentDashboard?.departmentCards || []).slice(0, 8),
      enrollmentTrends: (studentDashboard?.enrollmentTrends || []).slice(0, 5),
      gpaDistribution: studentDashboard?.gpaDistribution || [],
      generatedAt: new Date().toISOString(),
    }

    writeInsightsCache(profile.id, insights)

    return NextResponse.json(
      { insights },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('[api/university/admin-insights] Failed to load insights:', error)
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}
