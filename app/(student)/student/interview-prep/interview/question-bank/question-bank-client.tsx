'use client'

import { useEffect, useState, useTransition } from 'react'
import { BookmarkSimple, CheckCircle, MagnifyingGlass, SpinnerGap } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getQuestionBankQuestions,
  markQuestionAsPracticed,
  toggleQuestionBookmark,
} from '@/lib/actions/interview'
import type {
  QuestionBankFilterOptions,
  QuestionBankFilters,
  QuestionBankQuestion,
} from '@/lib/types/interview'

type Props = {
  initialQuestions: QuestionBankQuestion[]
  filterOptions: QuestionBankFilterOptions
  defaultRole: string
}

const DEFAULT_FILTERS: QuestionBankFilters = {
  search: '',
  category: 'all',
  difficulty: 'all',
  role: 'all',
}

function toRelativeDate(date: string | null): string {
  if (!date) return 'Not practiced yet'

  const diffMs = Date.now() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export function QuestionBankClient({ initialQuestions, filterOptions, defaultRole }: Props) {
  const [questions, setQuestions] = useState<QuestionBankQuestion[]>(initialQuestions)
  const [filters, setFilters] = useState<QuestionBankFilters>({
    ...DEFAULT_FILTERS,
    role: defaultRole || 'all',
  })
  const [error, setError] = useState<string | null>(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let isActive = true
    const timeout = setTimeout(async () => {
      setLoadingQuestions(true)
      setError(null)

      try {
        const rows = await getQuestionBankQuestions(filters)
        if (isActive) {
          setQuestions(rows)
        }
      } catch (queryError: any) {
        if (isActive) {
          setError(queryError?.message || 'Could not load question bank')
        }
      } finally {
        if (isActive) {
          setLoadingQuestions(false)
        }
      }
    }, 250)

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [filters])

  function updateFilter<K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function onToggleBookmark(question: QuestionBankQuestion) {
    const nextBookmarked = !question.bookmarked

    setQuestions((current) =>
      current.map((row) =>
        row.id === question.id
          ? {
              ...row,
              bookmarked: nextBookmarked,
            }
          : row
      )
    )

    startTransition(async () => {
      try {
        await toggleQuestionBookmark(question.id, nextBookmarked)
      } catch (bookmarkError: any) {
        setQuestions((current) =>
          current.map((row) =>
            row.id === question.id
              ? {
                  ...row,
                  bookmarked: question.bookmarked,
                }
              : row
          )
        )
        setError(bookmarkError?.message || 'Failed to update bookmark')
      }
    })
  }

  function onMarkPracticed(question: QuestionBankQuestion) {
    const optimisticDate = new Date().toISOString()

    setQuestions((current) =>
      current.map((row) =>
        row.id === question.id
          ? {
              ...row,
              practiced: true,
              lastScore: row.lastScore ?? 7,
              lastPracticedAt: optimisticDate,
            }
          : row
      )
    )

    startTransition(async () => {
      try {
        await markQuestionAsPracticed(question.id, question.lastScore ?? 7)
      } catch (practiceError: any) {
        setQuestions((current) =>
          current.map((row) =>
            row.id === question.id
              ? {
                  ...row,
                  practiced: question.practiced,
                  lastScore: question.lastScore,
                  lastPracticedAt: question.lastPracticedAt,
                }
              : row
          )
        )
        setError(practiceError?.message || 'Failed to mark as practiced')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Interview Questions</CardTitle>
          <CardDescription>
            Search and filter by category, difficulty, and target role. Bookmark important questions and mark completed practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="question-search">Search</Label>
              <div className="relative">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="question-search"
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Search questions by text or category"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => updateFilter('difficulty', value as QuestionBankFilters['difficulty'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  {filterOptions.difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {filterOptions.roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Bank</CardTitle>
          <CardDescription>
            {loadingQuestions ? 'Loading questions...' : `${questions.length} question(s) matched`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 && !loadingQuestions ? (
            <p className="text-sm text-muted-foreground">No questions match these filters.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge className="bg-info/15 text-info">{question.difficulty}</Badge>
                    {question.bookmarked && <Badge className="bg-warning/20 text-warning">Bookmarked</Badge>}
                    {question.practiced && <Badge className="bg-success/15 text-success">Practiced</Badge>}
                  </div>

                  <p className="font-medium leading-relaxed">{question.text}</p>

                  {(question.role_tags || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(question.role_tags || []).slice(0, 5).map((roleTag) => (
                        <Badge key={`${question.id}-${roleTag}`} variant="secondary">
                          {roleTag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Last practiced: {toRelativeDate(question.lastPracticedAt)}
                      {question.lastScore !== null ? ` • Last score: ${question.lastScore}/10` : ''}
                    </p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onToggleBookmark(question)} disabled={isPending}>
                        {isPending ? (
                          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BookmarkSimple className="mr-2 h-4 w-4" weight={question.bookmarked ? 'fill' : 'regular'} />
                        )}
                        {question.bookmarked ? 'Bookmarked' : 'Bookmark'}
                      </Button>

                      <Button size="sm" onClick={() => onMarkPracticed(question)} disabled={isPending}>
                        {isPending ? (
                          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Mark Practiced
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
