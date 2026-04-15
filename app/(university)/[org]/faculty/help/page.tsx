import { HelpSupportClient } from '@/app/(dashboard)/help/help-support-client'
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react/dist/ssr"


export default async function UniversityFacultyHelpPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Help & Support" icon={FacultyIcon} />
        <p className="text-muted-foreground">Find answers and get help when you need it</p>
      </div>

      <HelpSupportClient org={org} />
    </div>
  )
}

