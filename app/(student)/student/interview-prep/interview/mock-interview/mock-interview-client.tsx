'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowClockwise,
  CheckCircle,
  Clock,
  PlayCircle,
  Robot,
  SpinnerGap,
  TrendUp,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { getMockInterviewQuestions, saveMockInterviewSession } from '@/lib/actions/interview'
import type {
  InterviewEvaluation,
  InterviewQuestion,
  MockInterviewAnswer,
  RecentMockSession,
} from '@/lib/types/interview'

type Props = {
  initialRole: string
  prioritizedSkills: string[]
  roleSources: string[]
  recentSessions: RecentMockSession[]
}

const ROLE_OPTIONS = [
  'software engineer',
  'full stack developer',
  'frontend developer',
  'backend developer',
  'devops engineer',
  'data scientist',
]

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function MockInterviewClient({
  initialRole,
  prioritizedSkills,
  roleSources,
  recentSessions,
}: Props) {
  const router = useRouter()

  const [role, setRole] = useState(initialRole)
  const [questionCount, setQuestionCount] = useState('5')
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evaluatedCurrent, setEvaluatedCurrent] = useState<MockInterviewAnswer | null>(null)
  const [answers, setAnswers] = useState<MockInterviewAnswer[]>([])
  const [savingSession, setSavingSession] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<{ sessionId: string; score: number } | null>(null)

  const currentQuestion = questions[currentIndex] || null
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0
  const sessionInProgress = questions.length > 0 && !sessionSummary
  const answeredCount = answers.length + (evaluatedCurrent ? 1 : 0)

  const computedAverage = useMemo(() => {
    const all = [...answers, ...(evaluatedCurrent ? [evaluatedCurrent] : [])]
    if (all.length === 0) return 0
    const total = all.reduce((acc, item) => acc + Number(item.feedback.score || 0), 0)
    return Number((total / all.length).toFixed(2))
  }, [answers, evaluatedCurrent])

  async function handleStartSession() {
    setError(null)
    setSessionSummary(null)
    setAnswers([])
    setEvaluatedCurrent(null)
    setCurrentAnswer('')
    setCurrentIndex(0)
    setLoadingQuestions(true)

    try {
      const dbQuestions = await getMockInterviewQuestions({
        role,
        count: Number(questionCount),
        prioritizedSkills,
      })

      if (dbQuestions.length === 0) {
        throw new Error('No interview questions found in the database.')
      }

      let personalizedQuestion: InterviewQuestion | null = null
      try {
        const response = await fetch('/api/interview/personalized-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, skills: prioritizedSkills }),
        })

        if (response.ok) {
          const payload = await response.json()
          if (payload?.question) {
            personalizedQuestion = {
              id: `personalized-${Date.now()}`,
              text: String(payload.question),
              category: 'personalized',
              difficulty: 'medium',
              role_tags: [role],
              company_tags: ['AI'],
            }
          }
        }
      } catch {
        // Personalized question is best-effort and should not block session start.
      }

      const selected = personalizedQuestion
        ? [personalizedQuestion, ...dbQuestions].slice(0, Number(questionCount))
        : dbQuestions

      setQuestions(selected)
      setCurrentIndex(0)
      setCurrentAnswer('')
      setEvaluatedCurrent(null)
    } catch (startError: any) {
      setError(startError?.message || 'Failed to start mock interview session.')
    } finally {
      setLoadingQuestions(false)
    }
  }

  async function handleEvaluateAnswer() {
    if (!currentQuestion || !currentAnswer.trim()) {
      setError('Please enter an answer before evaluation.')
      return
    }

    setError(null)
    setEvaluating(true)

    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer: currentAnswer,
          role,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to evaluate answer')
      }

      const payload = (await response.json()) as InterviewEvaluation
      const evaluated: MockInterviewAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: currentAnswer,
        feedback: {
          score: Number(payload.score || 0),
          strengths: payload.strengths || [],
          weaknesses: payload.weaknesses || [],
          improvedAnswer: payload.improvedAnswer || '',
        },
        answeredAt: new Date().toISOString(),
      }

      setEvaluatedCurrent(evaluated)
    } catch (evaluateError: any) {
      setError(evaluateError?.message || 'Unable to evaluate answer right now.')
    } finally {
      setEvaluating(false)
    }
  }

  async function moveNext() {
    if (!evaluatedCurrent) {
      return
    }

    const nextAnswers = [...answers, evaluatedCurrent]
    setAnswers(nextAnswers)

    const isLastQuestion = currentIndex >= questions.length - 1
    if (isLastQuestion) {
      setSavingSession(true)
      try {
        const summary = await saveMockInterviewSession({
          role,
          questions,
          answers: nextAnswers,
        })

        setSessionSummary({ sessionId: summary.id, score: summary.score })
        setQuestions([])
        setCurrentIndex(0)
        setCurrentAnswer('')
        setEvaluatedCurrent(null)
      } catch (saveError: any) {
        setError(saveError?.message || 'Failed to save session')
      } finally {
        setSavingSession(false)
      }
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setCurrentAnswer('')
    setEvaluatedCurrent(null)
  }

  function resetSession() {
    setQuestions([])
    setCurrentIndex(0)
    setCurrentAnswer('')
    setEvaluatedCurrent(null)
    setAnswers([])
    setSessionSummary(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Setup</CardTitle>
          <CardDescription>
            Role is auto-detected from your profile and resume signals, but you can override it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Question count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="6">6 questions</SelectItem>
                  <SelectItem value="7">7 questions</SelectItem>
                  <SelectItem value="8">8 questions</SelectItem>
                  <SelectItem value="9">9 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {prioritizedSkills.length > 0 && (
            <div className="space-y-2">
              <Label>Skill-Based Prioritization</Label>
              <div className="flex flex-wrap gap-2">
                {prioritizedSkills.slice(0, 8).map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {roleSources.length > 0 && (
            <p className="text-xs text-muted-foreground">Role signals: {roleSources.join(', ')}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStartSession} disabled={loadingQuestions || sessionInProgress}>
              {loadingQuestions ? (
                <>
                  <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  Loading questions
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Mock Interview
                </>
              )}
            </Button>

            {sessionInProgress && (
              <Button variant="outline" onClick={resetSession}>
                <ArrowClockwise className="mr-2 h-4 w-4" />
                Reset Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {sessionInProgress && currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                Question {currentIndex + 1} of {questions.length}
              </CardTitle>
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            </div>
            <CardDescription className="capitalize">{currentQuestion.category}</CardDescription>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium leading-relaxed">{currentQuestion.text}</p>

            <div className="space-y-2">
              <Label htmlFor="answer">Your answer</Label>
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(event) => setCurrentAnswer(event.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                disabled={Boolean(evaluatedCurrent)}
              />
            </div>

            {!evaluatedCurrent ? (
              <Button onClick={handleEvaluateAnswer} disabled={evaluating || !currentAnswer.trim()}>
                {evaluating ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating
                  </>
                ) : (
                  <>
                    <Robot className="mr-2 h-4 w-4" />
                    Evaluate Answer
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">AI Feedback</h4>
                  <Badge className="bg-info/15 text-info">Score: {evaluatedCurrent.feedback.score}/10</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium">Strengths</p>
                  <ul className="mt-1 list-disc ps-5 text-sm text-muted-foreground">
                    {evaluatedCurrent.feedback.strengths.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium">Weaknesses</p>
                  <ul className="mt-1 list-disc ps-5 text-sm text-muted-foreground">
                    {evaluatedCurrent.feedback.weaknesses.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium">Improved Answer</p>
                  <p className="mt-1 text-sm text-muted-foreground">{evaluatedCurrent.feedback.improvedAnswer}</p>
                </div>

                <Button onClick={moveNext} disabled={savingSession}>
                  {savingSession ? (
                    <>
                      <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                      Saving session
                    </>
                  ) : currentIndex === questions.length - 1 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finish Session
                    </>
                  ) : (
                    'Next Question'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sessionSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Session Completed</CardTitle>
            <CardDescription>
              Your responses and AI feedback have been saved to your performance history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{sessionSummary.score}/10</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Questions Answered</p>
                <p className="text-2xl font-bold">{answers.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-lg font-semibold capitalize">{role}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Session ID: {sessionSummary.sessionId}</p>

            <div className="flex gap-2">
              <Button onClick={handleStartSession}>Start New Session</Button>
              <Button variant="outline" onClick={() => router.refresh()}>
                Refresh History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="h-5 w-5" />
            Recent Mock Sessions
          </CardTitle>
          <CardDescription>Saved interview runs from your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mock interview sessions yet. Start your first run above.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium capitalize">{session.role}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(session.date)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {session.questionCount} Qs
                    </span>
                    <Badge variant="outline">{session.score}/10</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        AI response format: score, 2 strengths, 2 weaknesses, and a 3-sentence improved answer.
      </p>

      <p className="text-xs text-muted-foreground">Live score preview: {computedAverage}/10</p>
    </div>
  )
}
