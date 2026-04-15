import { getUniversityDashboard } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { UniversityAdminDashboardDataClient } from './dashboard-data-client'


export default async function UniversityAdminDashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['university'])
  const dashboard = await getUniversityDashboard(profile.id)
  const initialData = { dashboard }

  return <UniversityAdminDashboardDataClient universityId={profile.id} org={org} initialData={initialData} />
}

