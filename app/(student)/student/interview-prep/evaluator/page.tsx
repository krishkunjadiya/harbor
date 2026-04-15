import { Robot as EvaluatorIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import { detectInterviewRoleForCurrentStudent } from '@/lib/actions/interview'
import { EvaluatorClient } from '../interview/evaluator/evaluator-client'

export default async function InterviewEvaluatorPage() {
  const roleDetection = await detectInterviewRoleForCurrentStudent()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Answer Evaluator" icon={EvaluatorIcon} />
        <p className="text-muted-foreground">
          Evaluate custom interview answers instantly with AI-powered structured feedback.
        </p>
      </div>

      <EvaluatorClient defaultRole={roleDetection?.role || 'software engineer'} />
    </div>
  )
}
