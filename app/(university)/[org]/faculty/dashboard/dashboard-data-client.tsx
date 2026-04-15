'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Users, Clock, Calendar, FileText, ChartBar, WarningCircle, SquaresFour as DashboardIcon } from '@phosphor-icons/react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHeader } from '@/components/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import FacultyDashboardLoading from './loading'

type FacultyDashboardPayload = {
  dashboardData: any
  gradeStatistics: any[]
  completionRates: any[]
}

async function fetchFacultyDashboard(scope: 'overview' | 'full'): Promise<FacultyDashboardPayload> {
  const response = await fetch(`/api/university/faculty-dashboard?scope=${scope}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load faculty dashboard')
  }

  return response.json()
}

export function FacultyDashboardDataClient({
  org,
  initialOverviewData,
}: {
  org: string
  initialOverviewData?: FacultyDashboardPayload
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'analytics'>('overview')

  const {
    data: overviewData,
    isPending: isOverviewPending,
    isError: isOverviewError,
  } = useQuery({
    queryKey: ['university', 'faculty-dashboard', org, 'overview'],
    queryFn: () => fetchFacultyDashboard('overview'),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: initialOverviewData,
  })

  const {
    data: fullData,
    isPending: isFullPending,
  } = useQuery({
    queryKey: ['university', 'faculty-dashboard', org, 'full'],
    queryFn: () => fetchFacultyDashboard('full'),
    enabled: activeTab === 'analytics',
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (isOverviewPending) {
    return <FacultyDashboardLoading />
  }

  if (isOverviewError || !overviewData?.dashboardData) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <DashboardHeader title="Faculty Dashboard" icon={DashboardIcon} />
          <p className="text-muted-foreground">Welcome back</p>
        </div>
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            Unable to load dashboard data. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const dashboardData = overviewData.dashboardData
  const gradeStatistics = fullData?.gradeStatistics || []
  const completionRates = fullData?.completionRates || []

  const profile = dashboardData.profile || { name: 'Faculty Member' }
  const courses = dashboardData.courses || []
  const recentAssignments = dashboardData.recentAssignments || []

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Faculty Dashboard" icon={DashboardIcon} />
        <p className="text-muted-foreground">Welcome back, {profile.name || 'Faculty Member'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">Assignments & projects</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'schedule' | 'analytics')} className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg">Schedule</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Courses</CardTitle>
                    <CardDescription>Active courses this semester</CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/${org}/faculty/courses`}>View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No courses assigned yet</p>
                  </div>
                ) : (
                  courses.slice(0, 4).map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/${org}/faculty/courses`}
                      className="block p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{course.code}</h3>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              {course.enrolled_count} students
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{course.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        {course.schedule || 'Schedule TBA'}
                      </div>
                      {course.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Course Progress</span>
                            <span className="font-medium">{course.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Assignments</CardTitle>
                    <CardDescription>Latest assignments created</CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/${org}/faculty/assignments`}>View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No assignments yet</p>
                  </div>
                ) : (
                  recentAssignments.map((assignment: any) => (
                    <Link
                      key={assignment.id}
                      href={`/${org}/faculty/assignments`}
                      className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link href={`/${org}/faculty/assignments`}>
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Create Assignment</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link href={`/${org}/faculty/enrollments`}>
                    <Users className="h-5 w-5" />
                    <span className="text-xs">View Enrollments</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link href={`/${org}/faculty/students`}>
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Student Profiles</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link href={`/${org}/faculty/academic-records`}>
                    <ChartBar className="h-5 w-5" />
                    <span className="text-xs">Academic Records</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link href={`/${org}/faculty/capstones`}>
                    <ChartBar className="h-5 w-5" />
                    <span className="text-xs">Capstone Projects</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Your Course Schedule</CardTitle>
              <CardDescription>Classes based on your enrolled courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.length > 0 ? (
                  courses.map((course: any) => (
                    <div key={course.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {course.code} - {course.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.schedule !== 'TBA' ? course.schedule : 'Schedule TBA'}
                      </div>
                      {course.room && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Room: {course.room}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {course.enrolled_count || 0} students enrolled
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No courses scheduled yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          {isFullPending && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Loading analytics...
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Average grades by course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeStatistics && gradeStatistics.length > 0 ? (
                    gradeStatistics.map((course, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{course.course}</span>
                          <span className="text-muted-foreground">{course.average}% avg</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              course.average >= 90 ? 'bg-success/100' :
                              course.average >= 80 ? 'bg-info/100' :
                              'bg-warning/100'
                            }`}
                            style={{ width: `${course.average}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No grade data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Completion</CardTitle>
                <CardDescription>Submission rates by course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completionRates && completionRates.length > 0 ? (
                    completionRates.map((course, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{course.course}</span>
                          <span className="text-muted-foreground">{course.rate}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${course.rate}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No submission data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>Summary of current courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses && courses.length > 0 ? (
                    courses.slice(0, 4).map((course: any) => (
                      <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{course.code}</p>
                          <p className="text-xs text-muted-foreground">{course.enrolled_count} students</p>
                        </div>
                        <span className="text-sm font-semibold">{course.progress || 0}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No courses available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
