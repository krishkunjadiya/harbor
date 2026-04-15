'use client'

import { useRealtimeJobApplications } from '@/lib/hooks/useRealtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, User, ArrowRight } from '@phosphor-icons/react'
import Link from 'next/link'
import { ApplicationStatusActions } from './application-status-actions'
import { formatDateUTC } from '@/lib/utils/date-format'

type Props = {
  recruiterId: string
  org: string
  /** 'preview' renders the compact recent-5 card; 'full' renders the full tab list */
  variant: 'preview' | 'full'
}

function statusStyle(status: string) {
  switch (status) {
    case 'accepted':   return 'bg-success/15 text-success'
    case 'rejected':   return 'bg-destructive/15 text-destructive'
    case 'shortlisted': return 'bg-info/15 text-info'
    case 'reviewing':  return 'bg-primary/15 text-primary'
    default:           return 'bg-warning/20 text-warning'
  }
}

export function DashboardApplications({ recruiterId, org, variant }: Props) {
  const { applications } = useRealtimeJobApplications(recruiterId)

  if (variant === 'preview') {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Pipeline Activity</CardTitle>
            <CardDescription>Latest candidates who applied</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${org}/applications`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                        {app.student?.full_name || app.student?.profiles?.full_name || 'Candidate'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        • {app.job?.title || 'Position'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied {formatDateUTC(app.applied_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusStyle(app.status)}`}>
                      {app.status}
                    </span>
                    <ApplicationStatusActions applicationId={app.id} currentStatus={app.status} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/${org}/candidates/${app.student_id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Pipeline Activity Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Pipeline updates will appear here once students start applying to your job postings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // variant === 'full'
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Candidates who applied to your jobs</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${org}/applications`}>Manage All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <div key={app.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-lg truncate">
                        {app.student?.full_name || app.student?.profiles?.full_name || 'Candidate'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${statusStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Applied for: <span className="font-medium text-foreground truncate">{app.job?.title || 'Position'}</span>
                    </p>
                    {app.cover_letter && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 bg-muted/30 p-2 rounded italic">
                        &quot;{app.cover_letter}&quot;
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Applied {formatDateUTC(app.applied_at)}
                      </p>
                      <div className="flex gap-2">
                        <ApplicationStatusActions applicationId={app.id} currentStatus={app.status} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${org}/candidates/${app.student_id}`}>
                            <User className="h-4 w-4 mr-1" />
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No pipeline entries found</p>
            <p className="text-xs text-muted-foreground">Pipeline entries appear here once students start applying</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
