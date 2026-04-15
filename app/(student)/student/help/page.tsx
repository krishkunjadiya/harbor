import { Question } from "@phosphor-icons/react/dist/ssr"
import { DashboardHeader } from "@/components/header"
import { HelpSupportClient } from "@/app/(dashboard)/help/help-support-client"

export const metadata = {
  title: 'Help & Support | Harbor',
  description: 'Get help and support' }

export const dynamic = 'force-static'
export const revalidate = 3600

export default function StudentHelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Help & Support" icon={Question} />
        <p className="text-muted-foreground">Find answers and get assistance</p>
      </div>

      <HelpSupportClient org="student" />
    </div>
  )
}

