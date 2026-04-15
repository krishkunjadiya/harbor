"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase,
  Users,
  TrendUp,
  Calendar,
  MapPin,
  CurrencyDollar as DollarSignIcon,
  Clock,
  CheckCircle,
  Plus as PlusIcon,
  PencilSimple,
  Eye } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { formatDateUTC } from '@/lib/utils/date-format'

interface JobsPageClientProps {
  jobs: any[]
  orgId: string
}

export default function JobsPageClient({ jobs, orgId }: JobsPageClientProps) {
  const activeJobs = jobs.filter(j => j.status === 'active')
  const draftJobs = jobs.filter(j => j.status === 'draft')
  const closedJobs = jobs.filter(j => j.status === 'closed')

  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applications?.[0]?.count || 0), 0)
  const avgMatchRate = jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + (job.match_rate || 0), 0) / jobs.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">Manage your open positions and track applications</p>
        </div>
        <Button asChild>
          <Link href={`/${orgId}/jobs/create`}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground">Currently hiring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplicants}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Rate</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchRate}%</div>
            <p className="text-xs text-muted-foreground">Quality score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(j => j.offers_made > 0).length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="active" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="active" className="rounded-lg">
            Active ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="rounded-lg">
            Drafts ({draftJobs.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="rounded-lg">
            Closed ({closedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Jobs</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Post your first job to start receiving applications
                </p>
                <Button asChild>
                  <Link href={`/${orgId}/jobs/create`}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Post New Job
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex flex-wrap gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location || 'Remote'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {job.job_type || 'Full-time'}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSignIcon className="h-3 w-3" />
                              {job.salary_range || 'Competitive'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateUTC(job.created_at)}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${orgId}/jobs/${job.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${orgId}/jobs/${job.id}/edit`}>
                            <PencilSimple className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Applicants</p>
                        <p className="text-2xl font-bold">{job.applications?.[0]?.count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">New</p>
                        <p className="text-2xl font-bold text-info">{job.new_applicants || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Shortlisted</p>
                        <p className="text-2xl font-bold text-success">{job.shortlisted || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Match Rate</p>
                        <p className="text-2xl font-bold">{job.match_rate || 0}%</p>
                      </div>
                    </div>
                    
                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No draft jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {draftJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>Draft - Not yet published</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${orgId}/jobs/${job.id}/edit`}>
                          <PencilSimple className="h-4 w-4 mr-2" />
                          Continue Editing
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No closed jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {closedJobs.map((job) => (
                <Card key={job.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>Closed on {formatDateUTC(job.updated_at)}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

