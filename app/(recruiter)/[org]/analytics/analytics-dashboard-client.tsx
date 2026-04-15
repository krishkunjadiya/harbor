'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendUp, Users, Briefcase, CheckCircle, Calendar, Eye } from '@phosphor-icons/react'
import { useRealtimeAnalytics } from '@/lib/hooks/useRealtime'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SpinnerGap as Loader2Icon, WarningCircle } from '@phosphor-icons/react'

interface AnalyticsDashboardClientProps {
  analytics: {
    totalApplications: number
    jobViews: number
    shortlisted: number
    interviews: number
    applicationsOverTime: any[]
    statusBreakdown: any[]
    topCourses: any[]
  } | null
  recruiterId: string
  org: string
}

export function AnalyticsDashboardClient({ analytics: initialAnalytics, recruiterId, org }: AnalyticsDashboardClientProps) {
  // Use real-time hook to automatically update when database changes
  const { analytics, isRefreshing, isLoading, error } = useRealtimeAnalytics(recruiterId, initialAnalytics)

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <Alert variant="destructive">
        <WarningCircle className="h-4 w-4" />
        <AlertTitle>Analytics unavailable</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  // Use analytics data or defaults
  const stats = {
    totalApplications: analytics?.totalApplications || 0,
    jobViews: analytics?.jobViews || 0,
    shortlisted: analytics?.shortlisted || 0,
    interviews: analytics?.interviews || 0
  }

  // Calculate percentages for the funnel
  // Application Rate: Applications / Job Views
  const applicationRate = stats.jobViews > 0 ? Math.round((stats.totalApplications / stats.jobViews) * 100) : 0
  
  // Shortlist Rate: Shortlisted / Applications
  const shortlistRate = stats.totalApplications > 0 ? Math.round((stats.shortlisted / stats.totalApplications) * 100) : 0
  
  // Interview Rate: Interviews / Applications
  const interviewRate = stats.totalApplications > 0 ? Math.round((stats.interviews / stats.totalApplications) * 100) : 0

  // Keep chart colors aligned with global chart tokens in app/globals.css.
  const COLORS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)'
  ]

  // Transform Status Breakdown for Pie Chart with colors
  const statusData = (analytics?.statusBreakdown || []).map((item: any, index: number) => ({
    ...item,
    name: item.status, // Recharts uses 'name'
    value: item.count, // Recharts uses 'value'
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="space-y-6">
      {(isRefreshing || error) && (
        <Alert variant={error ? 'destructive' : 'default'}>
          {isRefreshing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <WarningCircle className="h-4 w-4" />}
          <AlertTitle>{isRefreshing ? 'Refreshing analytics' : 'Refresh issue'}</AlertTitle>
          <AlertDescription>
            {isRefreshing
              ? 'Pulling latest metrics from the database...'
              : `Showing latest available data. ${error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Post Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobViews}</div>
            <p className="text-xs text-muted-foreground">Candidate views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              <TrendUp className="inline h-3 w-3 mr-1" />
              {applicationRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.shortlisted}</div>
            <p className="text-xs text-muted-foreground">{shortlistRate}% of applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviews}</div>
            <p className="text-xs text-muted-foreground">Scheduled interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Application Timeline</TabsTrigger>
          <TabsTrigger value="status">Status Breakdown</TabsTrigger>
          <TabsTrigger value="courses">Top Majors</TabsTrigger>
        </TabsList>

        {/* Application Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Number of applications received over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.applicationsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Applications" stroke="var(--color-chart-2)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Breakdown */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Application Status Breakdown</CardTitle>
              <CardDescription>Distribution of applications by status</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="var(--color-chart-1)"
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No status data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Courses / Majors */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Applications by Major</CardTitle>
              <CardDescription>Distribution of applications across student majors</CardDescription>
            </CardHeader>
            <CardContent>
              {(analytics?.topCourses || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.topCourses || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No major data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Application Rate</span>
              <span className="font-medium">{applicationRate}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Shortlist Rate</span>
              <span className="font-medium">{shortlistRate}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Interview Rate</span>
              <span className="font-medium">{interviewRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recruitment Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Job Views</span>
                <span className="text-sm">{stats.jobViews}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Applications</span>
                <span className="text-sm">{stats.totalApplications} ({applicationRate}%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-info h-2 rounded-full" style={{width: `${Math.min(applicationRate, 100)}%`}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Shortlisted</span>
                <span className="text-sm">{stats.shortlisted} ({shortlistRate}%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{width: `${Math.min(shortlistRate, 100)}%`}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Interviews</span>
                <span className="text-sm">{stats.interviews} ({interviewRate}%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{width: `${Math.min(interviewRate, 100)}%`}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

