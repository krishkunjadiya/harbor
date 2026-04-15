'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase,
  Users,
  TrendUp,
  Calendar,
  Plus as PlusIcon,
  Eye,
  PencilSimple,
  CaretRight,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardApplications } from './dashboard-applications'
import RecruiterDashboardLoading from './loading'

type RecruiterDashboardPayload = {
  dashboard: {
    stats: {
      active_jobs: number
      total_applications: number
      shortlisted: number
      hired: number
    }
    jobs: any[]
    profile: {
      company?: string | null
      industry?: string | null
      location?: string | null
      created_at?: string
    } | null
  } | null
}

async function fetchRecruiterDashboard(): Promise<RecruiterDashboardPayload> {
  const response = await fetch('/api/recruiter/dashboard', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load recruiter dashboard')
  }

  return response.json()
}

export function RecruiterDashboardDataClient({
  recruiterId,
  org,
  initialData,
}: {
  recruiterId: string
  org: string
  initialData?: RecruiterDashboardPayload
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['recruiter', 'dashboard', recruiterId],
    queryFn: fetchRecruiterDashboard,
    staleTime: 60 * 1000,
    initialData,
  })

  if (isPending) {
    return <RecruiterDashboardLoading />
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

  const { stats, jobs, profile } = data.dashboard

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recruiter Dashboard</h1>
          <p className="text-muted-foreground">Overview of your recruitment activities</p>
        </div>
        <Button asChild>
          <Link href={`/${org}/jobs/create`}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href={`/${org}/jobs`} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_jobs}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Currently hiring <CaretRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${org}/applications`} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_applications}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Across all jobs <CaretRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${org}/applications?filter=shortlisted`} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shortlisted}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                For interviews <CaretRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${org}/applications?filter=accepted`} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <TrendUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hired}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Successful placements <CaretRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg">Active Jobs</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg">Pipeline Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Your organization details</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${org}/settings/profile`}>
                    <PencilSimple className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-semibold">{profile?.company || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-semibold">{profile?.industry || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold">{profile?.location || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold" suppressHydrationWarning>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recruitment Summary</CardTitle>
                <CardDescription>Your hiring activity overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Link href={`/${org}/jobs`} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-info/15 flex items-center justify-center text-info">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Active Jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stats.active_jobs}</span>
                      <CaretRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>

                  <Link href={`/${org}/applications`} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center text-success">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Applications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stats.total_applications}</span>
                      <CaretRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>

                  <Link href={`/${org}/applications?filter=shortlisted`} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Shortlisted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stats.shortlisted}</span>
                      <CaretRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>

                  <Link href={`/${org}/applications?filter=accepted`} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                        <TrendUp className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Hired</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stats.hired}</span>
                      <CaretRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <DashboardApplications variant="preview" recruiterId={recruiterId} org={org} />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Job Postings</CardTitle>
                <CardDescription>Manage your open positions</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/${org}/jobs/create`}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Job
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">{job.location || 'Remote'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'active' ? 'bg-success/15 text-success' :
                              job.status === 'paused' ? 'bg-warning/20 text-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {job.status}
                            </span>
                            <span className="px-2 py-1 bg-info/10 text-info rounded-full text-xs font-medium">
                              {job.job_type}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/${org}/jobs/${job.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/${org}/jobs/${job.id}/edit`}>
                                <PencilSimple className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground" suppressHydrationWarning>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{job.experience_level}</span>
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <Link href={`/${org}/applications?jobId=${job.id}`}>
                            View {job.applications?.[0]?.count || 0} Applications
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Briefcase className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No Jobs Posted</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    You haven't posted any job opportunities yet. Create your first posting to start attracting top talent!
                  </p>
                  <Button asChild size="lg">
                    <Link href={`/${org}/jobs/create`}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Job
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <DashboardApplications variant="full" recruiterId={recruiterId} org={org} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
