'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  GraduationCap,
  TrendUp,
  Buildings,
  UserPlus as UserPlusIcon,
  FileText,
  ChartBar,
  SquaresFour as DashboardIcon,
} from '@phosphor-icons/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardHeader } from '@/components/header'
import { formatDate } from '@/lib/utils'
import UniversityDashboardLoading from './loading'

type UniversityDashboardPayload = {
  dashboard: {
    stats: {
      total_students: number
      total_faculty: number
      total_departments: number
      credentials_issued: number
    }
    profile: {
      university_name?: string | null
      city?: string | null
      country?: string | null
      website?: string | null
      created_at?: string
    } | null
  } | null
}

async function fetchUniversityDashboard(): Promise<UniversityDashboardPayload> {
  const response = await fetch('/api/university/admin-dashboard', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load university dashboard')
  }

  return response.json()
}

async function fetchFacultyDashboardOverview() {
  const response = await fetch('/api/university/admin-faculty', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Failed to prefetch admin faculty')
  return response.json()
}

async function fetchStudentDashboardOverview() {
  const response = await fetch('/api/university/admin-students', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Failed to prefetch admin students')
  return response.json()
}

async function fetchFacultyWorkspaceOverview() {
  const response = await fetch('/api/university/faculty-dashboard?scope=overview', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Failed to prefetch faculty workspace')
  return response.json()
}

async function fetchStudentWorkspaceOverview() {
  const response = await fetch('/api/university/student-dashboard?scope=overview', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Failed to prefetch student workspace')
  return response.json()
}

export function UniversityAdminDashboardDataClient({
  universityId,
  org,
  initialData,
}: {
  universityId: string
  org: string
  initialData?: UniversityDashboardPayload
}) {
  const queryClient = useQueryClient()

  const { data, isPending, isError } = useQuery({
    queryKey: ['university', 'admin-dashboard', universityId],
    queryFn: fetchUniversityDashboard,
    staleTime: 60 * 1000,
    initialData,
  })

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['university', 'admin-faculty', universityId],
      queryFn: fetchFacultyDashboardOverview,
      staleTime: 2 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['university', 'admin-students', org],
      queryFn: fetchStudentDashboardOverview,
      staleTime: 2 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['university', 'faculty-dashboard', org, 'overview'],
      queryFn: fetchFacultyWorkspaceOverview,
      staleTime: 2 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['university', 'student-dashboard', org, 'overview'],
      queryFn: fetchStudentWorkspaceOverview,
      staleTime: 2 * 60 * 1000,
    })
  }, [queryClient, universityId, org])

  if (isPending) {
    return <UniversityDashboardLoading />
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

  const { stats, profile } = data.dashboard

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Admin Dashboard" icon={DashboardIcon} />
        <p className="text-muted-foreground">University management and analytics overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_students}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_faculty}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Buildings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_departments}</div>
            <p className="text-xs text-muted-foreground">Academic departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credentials Issued</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.credentials_issued}</div>
            <p className="text-xs text-muted-foreground">Verified credentials</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>University Information</CardTitle>
                <CardDescription>Your institution details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">University Name</span>
                  <span className="font-semibold">{profile?.university_name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold">
                    {profile?.city && profile?.country
                      ? `${profile.city}, ${profile.country}`
                      : profile?.city || profile?.country || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Website</span>
                  <span className="font-semibold text-primary truncate max-w-[200px]">
                    {profile?.website || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold" suppressHydrationWarning>
                    {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Overview of your activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-info/15 flex items-center justify-center text-info">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Total Students</span>
                    </div>
                    <span className="font-bold text-lg">{stats.total_students}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center text-success">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Faculty Members</span>
                    </div>
                    <span className="font-bold text-lg">{stats.total_faculty}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                        <Buildings className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Departments</span>
                    </div>
                    <span className="font-bold text-lg">{stats.total_departments}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Credentials</span>
                    </div>
                    <span className="font-bold text-lg">{stats.credentials_issued}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: UserPlusIcon, label: 'Student Enrollment', href: `/${org}/admin/students` },
                  { icon: GraduationCap, label: 'Faculty Management', href: `/${org}/admin/faculty` },
                  { icon: GraduationCap, label: 'Faculty Workspace', href: `/${org}/faculty/dashboard` },
                  { icon: Users, label: 'Student Workspace', href: `/${org}/student/dashboard` },
                  { icon: FileText, label: 'Verify Credential', href: `/${org}/admin/credentials` },
                  { icon: Buildings, label: 'Manage Departments', href: `/${org}/admin/departments` },
                  { icon: ChartBar, label: 'View Reports', href: `/${org}/admin/reports` },
                  { icon: Users, label: 'Manage Users', href: `/${org}/admin/members` },
                  { icon: TrendUp, label: 'Analytics', href: `/${org}/admin/analytics` },
                ].map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors group"
                  >
                    <action.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Your university's presence on Harbor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Total Students</span>
                    <span className="text-lg font-bold text-info">{stats.total_students}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Faculty Members</span>
                    <span className="text-lg font-bold text-success">{stats.total_faculty}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Departments</span>
                    <span className="text-lg font-bold text-primary">{stats.total_departments}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                    <span className="text-sm font-medium">Credentials Issued</span>
                    <span className="text-lg font-bold text-primary">{stats.credentials_issued}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Recommended actions to maximize platform usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.total_students === 0 && (
                    <div className="p-3 border border-info/30 bg-info/10 rounded-lg">
                      <p className="text-sm font-medium text-info">Add Students</p>
                      <p className="text-xs text-info">Invite students to join your institution</p>
                    </div>
                  )}
                  {stats.total_faculty === 0 && (
                    <div className="p-3 border border-success/30 bg-success/10 rounded-lg">
                      <p className="text-sm font-medium text-success">Add Faculty</p>
                      <p className="text-xs text-success">Onboard teaching staff to the platform</p>
                    </div>
                  )}
                  {stats.total_departments > 0 && stats.total_students > 0 && stats.total_faculty > 0 && (
                    <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium text-primary">Great Job!</p>
                      <p className="text-xs text-muted-foreground">
                        Your institution is actively using the platform
                      </p>
                    </div>
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
