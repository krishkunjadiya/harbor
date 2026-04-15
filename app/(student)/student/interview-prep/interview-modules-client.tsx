'use client'

import Link from 'next/link'
import { Brain, BookOpen, Cards, ChartBar, Lightbulb, Stack } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MODULES = [
  {
    title: 'Mock Interview',
    description: 'AI-powered interview simulation with question-by-question scoring and session persistence.',
    href: '/student/interview-prep/mock-interview',
    icon: Brain,
    status: 'live',
  },
  {
    title: 'Question Bank',
    description: 'Filterable and searchable technical + behavioral question catalog.',
    href: '/student/interview-prep/question-bank',
    icon: BookOpen,
    status: 'live',
  },
  {
    title: 'Answer Evaluator',
    description: 'On-demand AI feedback for any custom answer.',
    href: '/student/interview-prep/evaluator',
    icon: Stack,
    status: 'live',
  },
  {
    title: 'Performance Tracker',
    description: 'Session analytics, weak areas, and trend tracking.',
    href: '/student/interview-prep/performance',
    icon: ChartBar,
    status: 'live',
  },
  {
    title: 'Prep Cards',
    description: 'Topic-based flashcards for rapid revision.',
    href: '/student/interview-prep/prep-cards',
    icon: Cards,
    status: 'live',
  },
  {
    title: 'Tips & Resources',
    description: 'Interview playbook, resource links, and checklists.',
    href: '/student/interview-prep/resources',
    icon: Lightbulb,
    status: 'live',
  },
]

export function InterviewModulesClient() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {MODULES.map((module) => {
        const Icon = module.icon
        const isLive = module.status === 'live'

        return (
          <Card key={module.title} className="flex h-full flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {isLive ? (
                  <Badge className="bg-success/15 text-success">Live</Badge>
                ) : (
                  <Badge variant="secondary">Planned</Badge>
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              {isLive ? (
                <Button asChild className="w-full">
                  <Link href={module.href}>Open Module</Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Coming Next
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
