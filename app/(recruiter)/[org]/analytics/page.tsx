import { AnalyticsDashboardClient } from './analytics-dashboard-client'
import { getAnalyticsData } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function AnalyticsDashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])
  const analytics = await getAnalyticsData(profile.id)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground">Track your recruitment metrics and insights</p>
        </div>
      </div>

      <AnalyticsDashboardClient analytics={analytics} recruiterId={profile.id} org={org} />
    </div>
  )
}
