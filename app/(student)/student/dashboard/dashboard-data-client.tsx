'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChartBar, FileText, Sparkle } from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickActionsCard, AddCredentialButton } from './dashboard-client'
import StudentDashboardLoading from './loading'

type StudentDashboardPayload = {
  dashboard: {
    credentials: any[]
    applications: any[]
    stats: {
      total_credentials: number
      applications_count: number
      profile_views: number
    }
  } | null
}

async function fetchStudentDashboard(): Promise<StudentDashboardPayload> {
  const response = await fetch('/api/student/dashboard', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load student dashboard')
  }

  return response.json()
}

export function StudentDashboardDataClient({
  studentId,
  profileName,
  initialData,
}: {
  studentId: string
  profileName?: string | null
  initialData?: StudentDashboardPayload
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['student', 'dashboard', studentId],
    queryFn: fetchStudentDashboard,
    staleTime: 60 * 1000,
    initialData,
  })

  if (isPending) {
    return <StudentDashboardLoading />
  }

  if (isError || !data?.dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load dashboard</CardTitle>
          <CardDescription>Please refresh and try again.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const dashboard = data.dashboard
  const { credentials = [], applications = [], stats } = dashboard

  const engagementScore = Math.min(
    100,
    credentials.filter((c: any) => c.verified).length * 10 + stats.applications_count * 5 + Math.min(stats.profile_views, 20)
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {profileName || 'Student'}!</h1>
        <p className="text-muted-foreground">Here's an overview of your academic and career progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credentials</CardTitle>
            <Sparkle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_credentials}</div>
            <p className="text-xs text-muted-foreground">{credentials.filter((c: any) => c.verified).length} verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications_count}</div>
            <p className="text-xs text-muted-foreground">{applications.filter((a: any) => a.status === 'pending').length} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profile_views}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementScore}%</div>
            <p className="text-xs text-muted-foreground">Based on verified achievements and job activity</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-muted/60 p-1 overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">Recent Activity</TabsTrigger>
          <TabsTrigger value="credentials" className="rounded-lg">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Credentials</CardTitle>
                <CardDescription>Your latest certifications and records</CardDescription>
              </CardHeader>
              <CardContent>
                {credentials.length > 0 ? (
                  <div className="space-y-4">
                    {credentials.slice(0, 5).map((credential: any) => (
                      <div key={credential.id} className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Sparkle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{credential.credential_name || credential.title || 'Credential'}</p>
                          <p className="text-xs text-muted-foreground">{credential.institution || 'Issuing Institution'}</p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {new Date(credential.issue_date || credential.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Sparkle className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No credentials added yet</p>
                    <p className="text-xs text-muted-foreground">Add certifications to build your profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Job Applications</CardTitle>
                <CardDescription>Your recent applications</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app: any) => (
                      <div key={app.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{app.job?.title || 'Job Position'}</p>
                            <p className="text-xs text-muted-foreground">{app.job?.company || 'Company'}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            app.status === 'accepted' ? 'bg-success/15 text-success' :
                            app.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                            app.status === 'shortlisted' ? 'bg-info/15 text-info' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No applications yet</p>
                    <p className="text-xs text-muted-foreground">Start applying to jobs!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your achievement summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Credentials</span>
                    <span className="text-sm font-medium">{stats.total_credentials}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Applications</span>
                    <span className="text-sm font-medium">{stats.applications_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Score</span>
                    <span className="text-sm font-medium">{engagementScore}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <QuickActionsCard />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...credentials.map((c: any) => ({
                  type: 'credential',
                  date: new Date(c.issue_date || c.created_at),
                  title: `Added ${c.credential_name || c.title || 'Credential'}`,
                  subtitle: c.institution || 'Credential updated',
                  id: c.id,
                })), ...applications.map((a: any) => ({
                  type: 'application',
                  date: new Date(a.applied_at),
                  title: 'Applied to Job',
                  subtitle: `${a.job?.title} at ${a.job?.company}`,
                  id: a.id,
                }))]
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 5)
                  .map((activity, index, list) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-2 w-2 rounded-full mt-2 ${activity.type === 'credential' ? 'bg-info' : 'bg-primary'}`} />
                        {index < list.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                          {activity.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Credentials</CardTitle>
              <CardDescription>Your verified credentials and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length > 0 ? (
                <div className="space-y-3">
                  {credentials.map((cred: any) => (
                    <div key={cred.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{cred.credential_name}</p>
                        <p className="text-xs text-muted-foreground">{cred.institution}</p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          Issued: {new Date(cred.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        cred.verified ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {cred.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No credentials added yet</p>
                  <p className="text-xs text-muted-foreground">Add your certifications and degrees!</p>
                  <AddCredentialButton />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
