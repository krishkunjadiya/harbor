import { redirect } from 'next/navigation'
import { Brain as BrainIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import { getCurrentProfile } from '@/lib/auth/cached'
import {
  detectInterviewRoleForCurrentStudent,
  getRecentMockSessions,
} from '@/lib/actions/interview'
import { MockInterviewClient } from '../interview/mock-interview/mock-interview-client'

export default async function MockInterviewPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  const [roleDetection, recentSessions] = await Promise.all([
    detectInterviewRoleForCurrentStudent(),
    getRecentMockSessions(6),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Mock Interview" icon={BrainIcon} />
        <p className="text-muted-foreground">
          Practice role-based interview questions with AI feedback after every answer.
        </p>
      </div>

      <MockInterviewClient
        initialRole={roleDetection?.role || 'software engineer'}
        prioritizedSkills={roleDetection?.prioritizedSkills || []}
        roleSources={roleDetection?.sources || []}
        recentSessions={recentSessions}
      />
    </div>
  )
}
