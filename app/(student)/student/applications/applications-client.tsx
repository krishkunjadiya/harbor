'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Briefcase, Calendar, Buildings, MapPin, MagnifyingGlass, CheckCircle, Clock, XCircle, ArrowSquareOut, FileText, Trash, Eye, DownloadSimple, CurrencyDollar as DollarSignIcon, Suitcase as BriefcaseBusinessIcon, ArrowsClockwise } from "@phosphor-icons/react"
import { withdrawApplication } from '@/lib/actions/mutations'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'

interface Application {
  id: string
  job_id: string
  job?: {
    id: string
    title: string
    company: string
    location: string | null
    job_type?: string | null
    experience_level?: string | null
    salary_range?: string | null
    status?: string | null
  }
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'
  applied_at: string
  cover_letter?: string | null
  resume_url?: string | null
}

interface ApplicationsClientProps {
  applications: Application[]
  studentId: string
}

export function ApplicationsClient({ applications, studentId }: ApplicationsClientProps) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected'>('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application)
    setIsDetailsOpen(true)
  }

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return
    }

    setIsWithdrawing(true)
    const result = await withdrawApplication(applicationId)
    
    if (result.success) {
      toast.success('Application withdrawn successfully')
      setIsDetailsOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student', 'applications-page-data', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['student', 'jobs-page-data', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['student', 'dashboard', studentId] }),
      ])
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to withdraw application')
    }
    
    setIsWithdrawing(false)
  }

  const handleDownloadResume = (resumeUrl: string) => {
    window.open(resumeUrl, '_blank')
  }

      const normalizedSearch = searchQuery.toLowerCase()
      const filteredApplications = applications.filter(app => {
      const matchesSearch = 
        app.job?.title?.toLowerCase()?.includes(normalizedSearch) ||
        app.job?.company?.toLowerCase()?.includes(normalizedSearch)
      
      const matchesFilter = filter === 'all' || app.status === filter    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/15 text-warning border-warning/35'
      case 'reviewing':
        return 'bg-info/10 text-info border-info/30'
      case 'shortlisted':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'accepted':
        return 'bg-success/10 text-success border-success/30'
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'reviewing':
        return <Briefcase className="h-4 w-4" />
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await queryClient.invalidateQueries({ queryKey: ['student', 'applications-page-data', studentId] })
            router.refresh()
          }}
          className="gap-2"
        >
          <ArrowsClockwise className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Reviewing</p>
              <p className="text-2xl font-bold text-info">{stats.reviewing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Shortlisted</p>
              <p className="text-2xl font-bold text-primary">{stats.shortlisted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold text-success">{stats.accepted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={filter} onValueChange={(val: any) => setFilter(val)}>
            <TabsList className="h-auto w-fit flex-wrap gap-1 rounded-xl border bg-background p-1">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="reviewing" className="rounded-lg">Reviewing</TabsTrigger>
              <TabsTrigger value="shortlisted" className="rounded-lg">Shortlisted</TabsTrigger>
              <TabsTrigger value="accepted" className="rounded-lg">Accepted</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-lg">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery || filter !== 'all' 
                ? 'No applications match your search or filter criteria.' 
                : 'You haven\'t applied to any jobs yet. Start exploring job opportunities!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="h-5 w-5 text-info" />
                      <CardTitle className="text-lg">{application.job?.title || 'Job Title'}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Buildings className="h-4 w-4" />
                        {application.job?.company || 'Company'}
                      </div>
                      {application.job?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.job.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1" suppressHydrationWarning>
                        <Calendar className="h-4 w-4" />
                        {mounted ? formatDate(application.applied_at) : '...'}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(application.status)} flex items-center gap-2`}>
                    {getStatusIcon(application.status)}
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>

              {application.cover_letter && (
                <CardContent className="space-y-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Cover Letter</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {application.cover_letter}
                    </p>
                  </div>
                </CardContent>
              )}

              <CardContent className="border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(application)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  
                  {application.resume_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResume(application.resume_url!)}
                    >
                      <DownloadSimple className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  {application.job?.id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/student/jobs/${application.job.id}`} prefetch={true}>
                        <ArrowSquareOut className="h-4 w-4 mr-2" />
                        View Job
                      </Link>
                    </Button>
                  )}
                  
                  {application.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleWithdraw(application.id)}
                      disabled={isWithdrawing}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-info" />
              {selectedApplication?.job?.title || 'Application Details'}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              Application submitted on {mounted && selectedApplication?.applied_at ? new Date(selectedApplication.applied_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '...'}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Status:</span>
                <Badge className={`${getStatusColor(selectedApplication.status)} flex items-center gap-2`}>
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status}
                </Badge>
              </div>

              {/* Job Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Company</p>
                    <div className="flex items-center gap-2">
                      <Buildings className="h-4 w-4 text-info" />
                      <p className="font-medium">{selectedApplication.job?.company}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-info" />
                      <p className="font-medium">{selectedApplication.job?.location || 'Not specified'}</p>
                    </div>
                  </div>

                  {selectedApplication.job?.job_type && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Job Type</p>
                      <div className="flex items-center gap-2">
                        <BriefcaseBusinessIcon className="h-4 w-4 text-info" />
                        <p className="font-medium capitalize">{selectedApplication.job.job_type}</p>
                      </div>
                    </div>
                  )}

                  {selectedApplication.job?.experience_level && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Experience Level</p>
                      <p className="font-medium capitalize">{selectedApplication.job.experience_level}</p>
                    </div>
                  )}

                  {selectedApplication.job?.salary_range && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Salary Range</p>
                      <div className="flex items-center gap-2">
                        <DollarSignIcon className="h-4 w-4 text-success" />
                        <p className="font-medium">{selectedApplication.job.salary_range}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Cover Letter</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedApplication.resume_url && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Resume</h3>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadResume(selectedApplication.resume_url!)}
                    className="w-full"
                  >
                    <DownloadSimple className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            {selectedApplication?.job?.id && (
              <Button variant="outline" asChild>
                <Link
                  href={`/student/jobs/${selectedApplication.job.id}`}
                  prefetch={true}
                  onClick={() => setIsDetailsOpen(false)}
                >
                  <ArrowSquareOut className="h-4 w-4 mr-2" />
                  View Job Posting
                </Link>
              </Button>
            )}
            
            {selectedApplication?.status === 'pending' && (
              <Button
                variant="destructive"
                onClick={() => selectedApplication && handleWithdraw(selectedApplication.id)}
                disabled={isWithdrawing}
              >
                <Trash className="h-4 w-4 mr-2" />
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
