import { InterviewModulesClient } from './interview-modules-client'
import { DashboardHeader } from "@/components/header"
import { Users as InterviewIcon } from "@phosphor-icons/react/dist/ssr"

export default function InterviewPrepPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Interview Preparation" icon={InterviewIcon} />
          <p className="text-muted-foreground">Structured interview prep modules with AI-guided practice</p>
        </div>
      </div>

      <InterviewModulesClient />
    </div>
  )
}

