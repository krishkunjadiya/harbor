import { requireRouteUserType } from '@/lib/auth/route-context'
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react/dist/ssr"
import { FacultyDataClient } from './faculty-data-client'


export default async function FacultyManagementPage() {
  const profile = await requireRouteUserType(['university'])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Faculty & Staff Management" icon={FacultyIcon} />
          <p className="text-muted-foreground">Manage faculty members and administrative staff</p>
        </div>
      </div>

      <FacultyDataClient orgId={profile.id} universityId={profile.id} />
    </div>
  )
}

