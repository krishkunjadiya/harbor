import { getRecruiterDashboard } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { RecruiterDashboardDataClient } from './dashboard-data-client'

export default async function RecruiterDashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const profile = await requireRouteUserType(['recruiter'])
  const { org } = await params

  const dashboard = await getRecruiterDashboard(profile.id)
  const initialData = { dashboard }

  return <RecruiterDashboardDataClient recruiterId={profile.id} org={org} initialData={initialData} />
}

