import { requireRouteUserType } from '@/lib/auth/route-context'
import { UniversityAdminAnalyticsDataClient } from './analytics-data-client'

export default async function UniversityAdminAnalyticsPage() {
  const profile = await requireRouteUserType(['university'])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Analytics</h1>
        <p className="text-muted-foreground">Track enrollment momentum and outcome quality in real time.</p>
      </div>

      <UniversityAdminAnalyticsDataClient universityId={profile.id} />
    </div>
  )
}
