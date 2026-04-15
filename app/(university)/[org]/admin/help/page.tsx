import { HelpSupportClient } from '@/app/(dashboard)/help/help-support-client'
import { DashboardHeader } from "@/components/header"
import { Question as HelpIcon } from "@phosphor-icons/react/dist/ssr"


export default async function UniversityAdminHelpPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Help & Support" icon={HelpIcon} />
          <p className="text-muted-foreground">Find answers and get help when you need it</p>
        </div>
      </div>

      <HelpSupportClient org={org} />
    </div>
  )
}

