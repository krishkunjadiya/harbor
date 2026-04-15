'use client'

import { useQuery } from '@tanstack/react-query'
import { ChartBar, GraduationCap, TrendUp, Users } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type UniversityAdminInsightsPayload = {
  insights: {
    summary: {
      totalStudents: number
      totalFaculty: number
      totalDepartments: number
      credentialsIssued: number
      activeEnrollments: number
      averagePerformance: number
    }
    topPerformers: Array<{
      name: string
      gpa: number
      department: string
    }>
    departmentCards: Array<{
      name: string
      students: number
      avgGpa: number
      retention: number
    }>
    generatedAt: string
  }
}

async function fetchUniversityAdminInsights(): Promise<UniversityAdminInsightsPayload> {
  const response = await fetch('/api/university/admin-insights', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load university reports')
  }

  return response.json()
}

export function UniversityAdminReportsDataClient({ universityId }: { universityId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['university', 'admin-insights', universityId],
    queryFn: fetchUniversityAdminInsights,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (isPending) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !data?.insights) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Failed to load reports. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  const { summary, topPerformers, departmentCards } = data.insights

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active student records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Teaching staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">Course enrollments tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averagePerformance}%</div>
            <p className="text-xs text-muted-foreground">Institution-wide GPA score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest GPA students across departments</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((student) => (
                  <div key={`${student.name}-${student.department}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">GPA {student.gpa.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Top performer</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No performer data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Snapshot</CardTitle>
            <CardDescription>Current participation and retention trends</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentCards.length > 0 ? (
              <div className="space-y-3">
                {departmentCards.slice(0, 6).map((department) => (
                  <div key={department.name} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{department.name}</p>
                        <p className="text-xs text-muted-foreground">{department.students} students</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">Avg GPA {department.avgGpa.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Retention {department.retention}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No department data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
