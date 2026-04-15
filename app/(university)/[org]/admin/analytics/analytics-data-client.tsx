'use client'

import { useQuery } from '@tanstack/react-query'
import { ChartBar, TrendUp } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type UniversityAdminInsightsPayload = {
  insights: {
    summary: {
      credentialsIssued: number
      averagePerformance: number
    }
    enrollmentTrends: Array<{
      year: string
      count: number
      change: string
    }>
    gpaDistribution: Array<{
      range: string
      count: number
      percentage: number
    }>
  }
}

async function fetchUniversityAdminInsights(): Promise<UniversityAdminInsightsPayload> {
  const response = await fetch('/api/university/admin-insights', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load university analytics')
  }

  return response.json()
}

export function UniversityAdminAnalyticsDataClient({ universityId }: { universityId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['university', 'admin-insights', universityId],
    queryFn: fetchUniversityAdminInsights,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError || !data?.insights) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Failed to load analytics. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  const { summary, enrollmentTrends, gpaDistribution } = data.insights

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credentials Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.credentialsIssued}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averagePerformance}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="h-5 w-5" />
              Enrollment Trends
            </CardTitle>
            <CardDescription>Recent yearly enrollment movement</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentTrends.length > 0 ? (
              <div className="space-y-3">
                {enrollmentTrends.map((trend) => (
                  <div key={trend.year} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-semibold">{trend.year}</p>
                      <p className="text-xs text-muted-foreground">{trend.count} enrollments</p>
                    </div>
                    <p className="text-sm font-medium">{trend.change}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No enrollment trend data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              GPA Distribution
            </CardTitle>
            <CardDescription>Distribution across academic bands</CardDescription>
          </CardHeader>
          <CardContent>
            {gpaDistribution.length > 0 ? (
              <div className="space-y-3">
                {gpaDistribution.map((bucket) => (
                  <div key={bucket.range} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{bucket.range}</span>
                      <span className="text-muted-foreground">
                        {bucket.count} students ({bucket.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, bucket.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No GPA distribution data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
