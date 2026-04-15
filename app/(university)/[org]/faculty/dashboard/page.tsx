import { getFacultyDashboard } from '@/lib/actions/database'
import { requireRouteUserType } from '@/lib/auth/route-context'
import { FacultyDashboardDataClient } from './dashboard-data-client'

export default async function FacultyDashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const profile = await requireRouteUserType(['university'])
  const { org } = await params
  const dashboardData = await getFacultyDashboard(profile.id)
  const initialOverviewData = {
    dashboardData,
    gradeStatistics: [],
    completionRates: [],
  }

  return <FacultyDashboardDataClient org={org} initialOverviewData={initialOverviewData} />
}
