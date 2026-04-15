import { Cards as PrepCardsIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import { getPrepCardsByTopic } from '@/lib/actions/interview'
import { PrepCardsClient } from '../interview/prep-cards/prep-cards-client'

export default async function InterviewPrepCardsPage() {
  const groups = await getPrepCardsByTopic(8)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Prep Cards" icon={PrepCardsIcon} />
        <p className="text-muted-foreground">
          Practice topic-wise flashcards and flip each card to reveal a concise answer framework.
        </p>
      </div>

      <PrepCardsClient groups={groups} />
    </div>
  )
}
