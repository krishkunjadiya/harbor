'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Briefcase, 
  MagnifyingGlass, 
  MapPin, 
  Clock,
  CurrencyDollar as DollarSignIcon,
  Faders,
  BookmarkSimple as BookmarkIcon,
  Bookmark as BookmarkCheckIcon, // Used fill-current for solid
  Suitcase as BriefcaseBusinessIcon,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  PaperPlaneRight,
  X as XIcon,
  ArrowsClockwise } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { applyToJob } from "@/lib/actions/mutations"
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from "@/lib/utils"
import { DashboardHeader } from "@/components/header"

interface Job {
  id: string
  title: string
  description: string | null
  location: string | null
  job_type: string
  experience_level?: string | null
  salary_range?: string | null
  skills_required?: string[] | null
  company?: string | null
  status: string
  created_at: string
  application_deadline?: string | null
  positions_available?: number | null
}

interface JobsClientProps {
  jobs: Job[]
  studentId: string
  applicationCount: number
  savedCount: number
}

export function JobsClient({ jobs, studentId, applicationCount, savedCount }: JobsClientProps) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])
  const [selectedJobType, setSelectedJobType] = useState<string>('all')
  const [selectedExperience, setSelectedExperience] = useState<string>('all')
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

      const normalizedSearch = searchQuery.toLowerCase()
      const filteredJobs = jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company?.toLowerCase()?.includes(normalizedSearch) ||
        job.description?.toLowerCase()?.includes(normalizedSearch)    
    const matchesJobType = selectedJobType === 'all' || job.job_type === selectedJobType
    const matchesExperience = selectedExperience === 'all' || job.experience_level === selectedExperience
    
    return matchesSearch && matchesJobType && matchesExperience
  })

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job)
    setCoverLetter('')
    setIsApplyDialogOpen(true)
  }

  const handleApplySubmit = async () => {
    if (!selectedJob) return

    setIsApplying(true)
    const result = await applyToJob(studentId, selectedJob.id, coverLetter || undefined)
    
    if (result.success) {
      toast.success('Application submitted successfully!')
      setIsApplyDialogOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student', 'jobs-page-data', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['student', 'applications-page-data', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['student', 'dashboard', studentId] }),
      ])
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to submit application')
    }
    
    setIsApplying(false)
  }

  const handleBookmarkToggle = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs)
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId)
      toast.success('Job removed from saved')
    } else {
      newSavedJobs.add(jobId)
      toast.success('Job saved successfully')
    }
    setSavedJobs(newSavedJobs)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedJobType('all')
    setSelectedExperience('all')
  }

  const jobTypes = Array.from(new Set(jobs.map(j => j.job_type).filter(Boolean))) as string[]
  const experienceLevels = Array.from(new Set(jobs.map(j => j.experience_level).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <DashboardHeader title="Job Openings" icon={Briefcase} />
          <p className="text-muted-foreground">Explore opportunities matching your skills</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/applications" prefetch={true}>
              <Briefcase className="h-4 w-4 mr-2" />
              My Applications
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ['student', 'jobs-page-data', studentId] })
              router.refresh()
            }}
          >
            <ArrowsClockwise className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs, companies, keywords..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Faders className="h-4 w-4" />
                  Filters
                </Button>
                {(searchQuery || selectedJobType !== 'all' || selectedExperience !== 'all') && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <XIcon className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <select 
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {jobTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <select 
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                  >
                    <option value="all">All Levels</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredJobs.length}</div>
            <p className="text-xs text-muted-foreground">Available positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationCount}</div>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved</CardTitle>
            <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedJobs.size}</div>
            <p className="text-xs text-muted-foreground">Bookmarked jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
            <MagnifyingGlass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredJobs.length > 0 ? Math.round((filteredJobs.length / jobs.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Of total jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {searchQuery || selectedJobType !== 'all' || selectedExperience !== 'all' 
              ? 'Filtered Results' 
              : 'Recommended for You'}
          </h2>
          <p className="text-sm text-muted-foreground">{filteredJobs.length} jobs found</p>
        </div>

        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                No jobs match your current filters. Try adjusting your search criteria.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{job.company || 'Company'}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleBookmarkToggle(job.id)}
                  >
                    {savedJobs.has(job.id) ? (
                      <BookmarkCheckIcon className="h-4 w-4 fill-current" />
                    ) : (
                      <BookmarkIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                
                {job.skills_required && job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.slice(0, 5).map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills_required.length > 5 && (
                      <Badge variant="outline">+{job.skills_required.length - 5} more</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="h-3 w-3" />
                      Posted {mounted ? formatDate(job.created_at) : '...'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BriefcaseBusinessIcon className="h-3 w-3" />
                      {job.job_type}
                    </span>
                    {job.experience_level && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {job.experience_level}
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="flex items-center gap-1">
                        <DollarSignIcon className="h-3 w-3" />
                        {job.salary_range}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/student/jobs/${job.id}`} prefetch={true}>View Details</Link>
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApplyClick(job)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <PaperPlaneRight className="h-6 w-6 text-info" />
              Apply for {selectedJob?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.company} • {selectedJob?.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Job Type:</span>
                <span className="font-medium">{selectedJob?.job_type}</span>
              </div>
              {selectedJob?.experience_level && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience Level:</span>
                  <span className="font-medium">{selectedJob.experience_level}</span>
                </div>
              )}
              {selectedJob?.salary_range && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salary Range:</span>
                  <span className="font-medium">{selectedJob.salary_range}</span>
                </div>
              )}
              {selectedJob?.application_deadline && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium text-destructive" suppressHydrationWarning>
                    {mounted ? formatDate(selectedJob.application_deadline) : '...'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                placeholder="Tell the employer why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {coverLetter.length} / 1000 characters
              </p>
            </div>

            <div className="bg-info/10 dark:bg-info/20 border border-info/30 dark:border-info/40 rounded-lg p-4">
              <p className="text-sm text-info dark:text-info">
                <strong>Note:</strong> Your profile information and resume will be automatically included with this application.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplySubmit}
              disabled={isApplying || coverLetter.length > 1000}
            >
              <PaperPlaneRight className="h-4 w-4 mr-2" />
              {isApplying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

