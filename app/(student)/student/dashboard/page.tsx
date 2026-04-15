import { getStudentDashboard } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { StudentDashboardDataClient } from './dashboard-data-client'

export default async function StudentDashboardPage() {
  const profile = await requireRouteUserType(['student'])
  const dashboard = await getStudentDashboard(profile.id)
  const initialData = { dashboard }

  return <StudentDashboardDataClient studentId={profile.id} profileName={profile.full_name} initialData={initialData} />
}

