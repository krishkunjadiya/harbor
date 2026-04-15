import { DashboardHeader } from "@/components/header"
import { BookOpen } from "@phosphor-icons/react/dist/ssr"
import { LearningResourcesManager } from "@/components/learning-resources-manager"
import { getLearningResources } from "@/lib/actions/database"

export default async function AdminLearningResourcesPage() {
  const initialResources = await getLearningResources()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Manage Learning Resources" icon={BookOpen} />
          <p className="text-muted-foreground mt-2">
            Upload and organize educational materials, videos, and documentation for students.
          </p>
        </div>
      </div>
      <LearningResourcesManager initialResources={initialResources} role="admin" />
    </div>
  )
}
