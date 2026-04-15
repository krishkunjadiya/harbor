import { requireRouteUserType } from "@/lib/auth/route-context"
import { StudentJobsDataClient } from "./jobs-data-client"
import { DashboardHeader } from "@/components/header"
import { Briefcase } from "@phosphor-icons/react/dist/ssr"

export const metadata = {
  title: 'Job Openings | Harbor',
  description: 'Explore job opportunities matching your skills' }

export default async function StudentJobsPage() {
  const profile = await requireRouteUserType(['student'])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Job Openings" icon={Briefcase} />
        <p className="text-muted-foreground">Explore job opportunities matching your skills</p>
      </div>
      <StudentJobsDataClient studentId={profile.id} />
    </div>
  )
}

