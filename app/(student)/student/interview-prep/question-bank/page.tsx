import { BookOpen as QuestionBankIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import {
  detectInterviewRoleForCurrentStudent,
  getQuestionBankFilterOptions,
  getQuestionBankQuestions,
} from '@/lib/actions/interview'
import { QuestionBankClient } from '../interview/question-bank/question-bank-client'

export default async function InterviewQuestionBankPage() {
  const [roleDetection, filterOptions, initialQuestions] = await Promise.all([
    detectInterviewRoleForCurrentStudent(),
    getQuestionBankFilterOptions(),
    getQuestionBankQuestions(),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Question Bank" icon={QuestionBankIcon} />
        <p className="text-muted-foreground">
          Browse and practice role-specific interview questions with bookmark and progress tracking.
        </p>
      </div>

      <QuestionBankClient
        initialQuestions={initialQuestions}
        filterOptions={filterOptions}
        defaultRole={roleDetection?.role || 'all'}
      />
    </div>
  )
}
