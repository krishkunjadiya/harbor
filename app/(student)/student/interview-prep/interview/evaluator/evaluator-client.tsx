'use client'

import { useState } from 'react'
import { Robot, SpinnerGap } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InterviewEvaluation } from '@/lib/types/interview'

type Props = {
  defaultRole: string
}

const ROLE_OPTIONS = [
  'software engineer',
  'full stack developer',
  'frontend developer',
  'backend developer',
  'devops engineer',
  'data scientist',
]

export function EvaluatorClient({ defaultRole }: Props) {
  const [role, setRole] = useState(defaultRole || 'software engineer')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function evaluateAnswer() {
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are both required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          role,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to evaluate answer')
      }

      setEvaluation({
        score: Number(payload.score || 0),
        strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
        weaknesses: Array.isArray(payload.weaknesses) ? payload.weaknesses : [],
        improvedAnswer: String(payload.improvedAnswer || ''),
      })
    } catch (requestError: any) {
      setEvaluation(null)
      setError(requestError?.message || 'Unable to evaluate answer right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Answer Evaluator</CardTitle>
          <CardDescription>
            Enter one interview question and your answer, then get structured AI feedback with score, strengths,
            weaknesses, and an improved answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-question">Interview question</Label>
            <Input
              id="eval-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Explain the trade-offs between SQL and NoSQL databases."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-answer">Your answer</Label>
            <Textarea
              id="eval-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your interview answer here..."
              rows={8}
            />
          </div>

          <Button onClick={evaluateAnswer} disabled={loading || !question.trim() || !answer.trim()}>
            {loading ? (
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
        </CardContent>
      </Card>

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Result</CardTitle>
            <CardDescription>Structured AI feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Overall score</p>
              <Badge className="bg-info/15 text-info">{evaluation.score}/10</Badge>
            </div>

            <div>
              <p className="text-sm font-medium">Strengths</p>
              <ul className="mt-1 list-disc ps-5 text-sm text-muted-foreground">
                {evaluation.strengths.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Weaknesses</p>
              <ul className="mt-1 list-disc ps-5 text-sm text-muted-foreground">
                {evaluation.weaknesses.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Improved answer</p>
              <p className="mt-1 text-sm text-muted-foreground">{evaluation.improvedAnswer}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
