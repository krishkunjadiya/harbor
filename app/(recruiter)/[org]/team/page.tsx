import { TeamCollaborationClient } from './team-collaboration-client'
import { getTeamMembers, getRecruiterTeamRecentActivity } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function TeamCollaborationPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])

  const [teamMembers, recentActivity] = await Promise.all([
    getTeamMembers(profile.id),
    getRecruiterTeamRecentActivity(profile.id, 12),
  ])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
        <p className="text-muted-foreground">Collaborate with your recruitment team</p>
      </div>

      <TeamCollaborationClient org={org} teamMembers={teamMembers} recentActivity={recentActivity} />
    </div>
  )
}
