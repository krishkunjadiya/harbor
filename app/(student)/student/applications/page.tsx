import { requireRouteUserType } from '@/lib/auth/route-context'
import { StudentApplicationsDataClient } from './applications-data-client'
import { DashboardHeader } from "@/components/header"
import { Briefcase } from "@phosphor-icons/react/dist/ssr"

export const metadata = {
  title: 'Job Applications | Harbor',
  description: 'View and manage your job applications' }

export default async function ApplicationsPage() {
  const profile = await requireRouteUserType(['student'])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Job Applications" icon={Briefcase} />
        <p className="text-muted-foreground">Track all your job applications and their status</p>
      </div>

      <StudentApplicationsDataClient studentId={profile.id} />
    </div>
  )
}

