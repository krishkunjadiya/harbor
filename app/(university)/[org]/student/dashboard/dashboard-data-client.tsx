'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, TrendUp, BookOpen, SquaresFour as DashboardIcon } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardHeader } from '@/components/header'

import UniversityStudentDashboardLoading from './loading'

type UniversityStudentDashboardPayload = {
  data: any
}

async function fetchUniversityStudentDashboard(scope: 'overview' | 'full'): Promise<UniversityStudentDashboardPayload> {
  const response = await fetch(`/api/university/student-dashboard?scope=${scope}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load student dashboard')
  }

  return response.json()
}

export function UniversityStudentDashboardDataClient({
  org,
  initialOverviewPayload,
}: {
  org: string
  initialOverviewPayload?: UniversityStudentDashboardPayload
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'analytics'>('overview')

  const {
    data: overviewPayload,
    isPending: isOverviewPending,
    isError: isOverviewError,
  } = useQuery({
    queryKey: ['university', 'student-dashboard', org, 'overview'],
    queryFn: () => fetchUniversityStudentDashboard('overview'),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: initialOverviewPayload,
  })

  const {
    data: fullPayload,
    isPending: isFullPending,
  } = useQuery({
    queryKey: ['university', 'student-dashboard', org, 'full'],
    queryFn: () => fetchUniversityStudentDashboard('full'),
    enabled: activeTab !== 'overview',
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (isOverviewPending) {
    return <UniversityStudentDashboardLoading />
  }

  if (isOverviewError || !overviewPayload?.data) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <DashboardHeader title="Student Dashboard" icon={DashboardIcon} />
          <p className="text-muted-foreground">University-wide student overview and analytics</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-destructive">Unable to load dashboard data. Please refresh and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = activeTab === 'overview' ? overviewPayload.data : (fullPayload?.data || overviewPayload.data)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Student Dashboard" icon={DashboardIcon} />
        <p className="text-muted-foreground">University-wide student overview and analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Live university student count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">Course registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <TrendUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averagePerformance}%</div>
            <p className="text-xs text-muted-foreground">Calculated from student GPA data</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'departments' | 'analytics')} className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="departments" className="rounded-lg">By Department</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
                <CardDescription>Latest student registrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentEnrollments.length > 0 ? (
                  data.recentEnrollments.map((student: any) => (
                    <div key={student.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.id} • {student.department}</p>
                      </div>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {student.date ? new Date(student.date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent enrollment activity.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest GPA students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.topPerformers.length > 0 ? (
                  data.topPerformers.map((student: any, index: number) => (
                    <div key={`${student.name}-${index}`} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-success">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{student.gpa}</p>
                        <p className="text-xs text-muted-foreground">Top performer</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No GPA records available yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Distribution</CardTitle>
              <CardDescription>Students by department and year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departmentBreakdown.length > 0 ? (
                  data.departmentBreakdown.map((dept: any) => (
                    <div key={dept.dept} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dept.dept}</span>
                        <span className="text-muted-foreground">{dept.total} students</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 border rounded text-center">
                          <p className="text-muted-foreground">Year 1</p>
                          <p className="font-semibold">{dept.year1}</p>
                        </div>
                        <div className="p-2 border rounded text-center">
                          <p className="text-muted-foreground">Year 2</p>
                          <p className="font-semibold">{dept.year2}</p>
                        </div>
                        <div className="p-2 border rounded text-center">
                          <p className="text-muted-foreground">Year 3</p>
                          <p className="font-semibold">{dept.year3}</p>
                        </div>
                        <div className="p-2 border rounded text-center">
                          <p className="text-muted-foreground">Year 4</p>
                          <p className="font-semibold">{dept.year4}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No department data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-5">
          {activeTab === 'departments' && isFullPending && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground">Loading department analytics...</p>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.departmentCards.length > 0 ? (
              data.departmentCards.map((dept: any) => (
                <Card key={dept.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Students</span>
                      <span className="font-semibold">{dept.students}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg. GPA</span>
                      <span className="font-semibold">{dept.avgGpa}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Retention Proxy</span>
                      <span className="font-semibold text-success">{dept.retention}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="py-8">
                  <p className="text-sm text-muted-foreground">No department metrics available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          {activeTab === 'analytics' && isFullPending && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground">Loading detailed analytics...</p>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GPA Distribution</CardTitle>
                <CardDescription>Student performance across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.gpaDistribution.map((grade: any) => (
                    <div key={grade.range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{grade.range}</span>
                        <span className="text-muted-foreground">{grade.count} students</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${grade.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Student enrollment over recent years</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.enrollmentTrends.length > 0 ? (
                    data.enrollmentTrends.map((item: any) => (
                      <div key={item.year} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.year}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                          <span className={`text-sm font-medium ${item.change.startsWith('+') ? 'text-success' : 'text-warning'}`}>
                            {item.change}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough enrollment history yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Graduation Rates</CardTitle>
                <CardDescription>Department graduation proxy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.graduationRates.length > 0 ? (
                    data.graduationRates.map((item: any) => (
                      <div key={item.dept} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{item.dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-success" style={{ width: `${item.rate}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-success w-12 text-right">{item.rate}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No graduation metrics available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Semester Performance Comparison</CardTitle>
              <CardDescription>Average GPA trend proxy across terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {data.semesterPerformance.length > 0 ? (
                  data.semesterPerformance.map((sem: any) => (
                    <div key={sem.semester} className="p-4 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-2">{sem.semester}</p>
                      <p className="text-2xl font-bold mb-1">{sem.gpa}</p>
                      <div className={`flex items-center justify-center gap-1 ${sem.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                        <TrendUp className={`h-3 w-3 ${sem.trend === 'down' ? 'rotate-180' : ''}`} />
                        <span className="text-xs font-medium">{sem.trend === 'up' ? 'Up' : 'Down'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground md:col-span-5">No semester comparison data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
