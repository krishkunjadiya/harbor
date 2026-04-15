'use client'

import { ChartBar, ClockCounterClockwise, Pulse, Target } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { PerformanceTrackerData } from '@/lib/types/interview'

type Props = {
  data: PerformanceTrackerData
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function PerformanceClient({ data }: Props) {
  const latestScore = data.scoreTrend.length > 0 ? data.scoreTrend[data.scoreTrend.length - 1].score : 0
  const previousScore = data.scoreTrend.length > 1 ? data.scoreTrend[data.scoreTrend.length - 2].score : latestScore
  const delta = Number((latestScore - previousScore).toFixed(2))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Saved mock interview sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore}/10</div>
            <p className="text-xs text-muted-foreground">Across all mock sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practiced Questions</CardTitle>
            <Pulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPracticedQuestions}</div>
            <p className="text-xs text-muted-foreground">Distinct questions practiced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Momentum</CardTitle>
            <ClockCounterClockwise className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delta >= 0 ? `+${delta}` : delta}</div>
            <p className="text-xs text-muted-foreground">Change vs previous session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weak Topics</CardTitle>
            <CardDescription>Categories where your average score is currently lowest.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No practiced-question data yet.</p>
            ) : (
              <div className="space-y-4">
                {data.weakTopics.map((topic) => (
                  <div key={topic.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{topic.category}</p>
                        <p className="text-xs text-muted-foreground">{topic.attempts} attempts</p>
                      </div>
                      <Badge variant="outline">{topic.averageScore}/10</Badge>
                    </div>
                    <Progress value={topic.averageScore * 10} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest session and practice events.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <Badge variant="secondary">{activity.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(activity.date)}</span>
                      {activity.score !== null && <span>Score: {activity.score}/10</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Trend (Recent Sessions)</CardTitle>
          <CardDescription>Quick analytics view of your latest mock interview scores.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.scoreTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">No score trend available yet.</p>
          ) : (
            <div className="space-y-2">
              {data.scoreTrend.map((point) => (
                <div key={`${point.label}-${point.score}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{point.label}</span>
                    <span>{point.score}/10</span>
                  </div>
                  <Progress value={point.score * 10} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
