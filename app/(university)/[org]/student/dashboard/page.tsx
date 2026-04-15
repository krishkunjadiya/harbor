import { getUniversityDashboard } from '@/lib/actions/database'
import { requireRouteUserType } from '@/lib/auth/route-context'
import { UniversityStudentDashboardDataClient } from './dashboard-data-client'

export default async function UniversityStudentDashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const profile = await requireRouteUserType(['university'])
  const { org } = await params
  const dashboard = await getUniversityDashboard(profile.id)

  const initialOverviewPayload = {
    data: {
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
    },
  }

  return <UniversityStudentDashboardDataClient org={org} initialOverviewPayload={initialOverviewPayload} />
}
