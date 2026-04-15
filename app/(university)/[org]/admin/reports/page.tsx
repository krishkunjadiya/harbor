import { requireRouteUserType } from '@/lib/auth/route-context'
import { UniversityAdminReportsDataClient } from './reports-data-client'

export default async function UniversityAdminReportsPage() {
  const profile = await requireRouteUserType(['university'])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Reports</h1>
        <p className="text-muted-foreground">View institutional reporting and student performance summaries.</p>
      </div>

      <UniversityAdminReportsDataClient universityId={profile.id} />
    </div>
  )
}
