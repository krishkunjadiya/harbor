'use client'

import Link from 'next/link'
import { useRealtimeJobApplications, useNotificationPermission } from '@/lib/hooks/useRealtime'
import { updateApplicationStatus } from '@/lib/actions/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'
import { formatDateUTC } from '@/lib/utils/date-format'
import { 
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  User,
  EnvelopeSimple as Envelope,
  Calendar } from '@phosphor-icons/react/dist/ssr'

type ApplicationFilter = 'all' | 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'

type JobApplicationsClientProps = {
  recruiterId: string
  org: string
  initialFilter?: ApplicationFilter
  initialApplications?: any[]
}

export function JobApplicationsClient({ recruiterId, org, initialFilter = 'all', initialApplications = [] }: JobApplicationsClientProps) {
  const { applications, newApplicationCount } = useRealtimeJobApplications(recruiterId, initialApplications)
  const { permission, requestPermission } = useNotificationPermission()
  const [filter, setFilter] = useState<ApplicationFilter>(initialFilter)

  useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  const handleStatusChange = async (applicationId: string, status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted') => {
    await updateApplicationStatus(applicationId, status)
    // The realtime subscription will automatically update the UI
  }

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/15 text-warning border-warning/35'
      case 'reviewing':
        return 'bg-info/10 text-info border-info/30'
      case 'shortlisted':
        return 'bg-success/10 text-success border-success/30'
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      case 'accepted':
        return 'bg-primary/10 text-primary border-primary/30'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length }

  const getInterviewHref = (application: any) => {
    const params = new URLSearchParams({
      candidateId: application.student_id,
      jobId: application.job_id,
      candidateName: (application.student as any)?.full_name || '',
      position: (application.job as any)?.title || '',
    })

    return `/${org}/interviews?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header with new applications badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Candidate Pipeline</h1>
          <span className="text-sm text-muted-foreground">
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
            {newApplicationCount > 0 && (
              <Badge variant="default" className="ml-2">
                {newApplicationCount} new
              </Badge>
            )}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shortlisted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as ApplicationFilter)}>
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
          <TabsTrigger value="reviewing" className="rounded-lg">Reviewing</TabsTrigger>
          <TabsTrigger value="shortlisted" className="rounded-lg">Shortlisted</TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg">Accepted</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Candidates in Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  No pipeline entries found for this filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {(application.job as any)?.title || 'Job Title'}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{(application.student as any)?.full_name || 'Student'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateUTC(application.applied_at || application.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.cover_letter && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {application.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(application.id, 'reviewing')}
                        >
                          Start Reviewing
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {application.status === 'reviewing' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(application.id, 'shortlisted')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {application.status === 'shortlisted' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(application.id, 'accepted')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={getInterviewHref(application)} prefetch={true}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {application.status === 'accepted' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={getInterviewHref(application)} prefetch={true}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/${org}/candidates/${application.student_id}`} prefetch={true}>View Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
