import { LearningResourcesClient } from './learning-resources-client'
import { getLearningResources } from "@/lib/actions/database"
import { DashboardHeader } from "@/components/header"
import { BookOpen } from "@phosphor-icons/react/dist/ssr"

export default async function LearningResourcesPage() {
  const resources = await getLearningResources()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Learning Resources" icon={BookOpen} />
          <p className="text-muted-foreground">Access educational materials and learning tools</p>
        </div>
      </div>

      <LearningResourcesClient resources={resources} />
    </div>
  )
}

