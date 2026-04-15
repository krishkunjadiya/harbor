import { Lightbulb as ResourcesIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import { getInterviewResourcesContent } from '@/lib/actions/interview'
import { ResourcesClient } from '../interview/resources/resources-client'

export default async function InterviewResourcesPage() {
  const sections = await getInterviewResourcesContent()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Tips & Resources" icon={ResourcesIcon} />
        <p className="text-muted-foreground">
          Curated static playbooks and links for before, during, and after interview rounds.
        </p>
      </div>

      <ResourcesClient sections={sections} />
    </div>
  )
}
