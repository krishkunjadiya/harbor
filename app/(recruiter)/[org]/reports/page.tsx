import { requireRouteUserType } from "@/lib/auth/route-context"
import { getRecentReports } from "@/lib/actions/reports"
import { RecruiterReportsDataClient } from './reports-data-client'

export default async function ReportsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])
  const recentReports = await getRecentReports(profile.id)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and export detailed reports</p>
      </div>

      <RecruiterReportsDataClient org={org} recruiterId={profile.id} initialRecentReports={recentReports} />
    </div>
  )
}
