import { getSavedCandidates } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { RecruiterSavedCandidatesDataClient } from './saved-candidates-data-client'

export default async function SavedCandidatesPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])
  const candidates = await getSavedCandidates(profile.id)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shortlisted Candidates</h1>
          <p className="text-muted-foreground">Manage candidates you shortlisted for follow-up</p>
        </div>
      </div>

      <RecruiterSavedCandidatesDataClient org={org} recruiterId={profile.id} initialCandidates={candidates} />
    </div>
  )
}
