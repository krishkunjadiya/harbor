'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Briefcase, 
  MapPin, 
  Clock,
  CurrencyDollar as DollarSignIcon,
  BookmarkSimple as BookmarkIcon,
  Bookmark as BookmarkCheckIcon,
  Suitcase as BriefcaseBusinessIcon,
  Calendar,
  Users,
  GraduationCap,
  Buildings,
  PaperPlaneRight as PaperPlaneTilt,
  ArrowLeft,
  CheckCircle as CheckCircle2Icon,
  WarningCircle,
  Info
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { applyToJob, incrementJobViews } from "@/lib/actions/mutations"
import { formatDate } from "@/lib/utils"

interface Job {
  id: string
  title: string
  description: string | null
  location: string | null
  job_type: string
  experience_level?: string | null
  salary_range?: string | null
  // Support both field names: DB schema uses skills_required, updates added required_skills
  required_skills?: string[] | null
  skills_required?: string[] | null
  // Support both field names: DB schema uses company, updates added company_name
  company_name?: string | null
  company?: string | null
  status: string
  created_at: string
  application_deadline?: string | null
  positions_available?: number | null
  responsibilities?: string[] | null
  qualifications?: string[] | null
  benefits?: string[] | null
}

interface JobDetailClientProps {
  job: Job
  studentId: string
  hasApplied: boolean
}

export function JobDetailClient({ job, studentId, hasApplied }: JobDetailClientProps) {
  const [mounted, setMounted] = useState(false)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Track job view
    incrementJobViews(job.id)
  }, [job.id])
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [applied, setApplied] = useState(hasApplied)
  const router = useRouter()

  const handleApplySubmit = async () => {
    setIsApplying(true)
    const result = await applyToJob(studentId, job.id, coverLetter || undefined)
    
    if (result.success) {
      toast.success('Application submitted successfully!')
      setIsApplyDialogOpen(false)
      setApplied(true)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to submit application')
    }
    
    setIsApplying(false)
  }

  const handleSaveToggle = () => {
    setIsSaved(!isSaved)
    toast.success(isSaved ? 'Job removed from saved' : 'Job saved successfully')
  }

  const isDeadlinePassed = job.application_deadline 
    ? new Date(job.application_deadline) < new Date() 
    : false

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-info" />
                <CardTitle className="text-3xl">{job.title}</CardTitle>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Buildings className="h-4 w-4" />
                  <span className="font-medium">{job.company_name || job.company || 'Company Name'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2" suppressHydrationWarning>
                  <Clock className="h-4 w-4" />
                  <span>Posted {mounted ? formatDate(job.created_at) : '...'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <BriefcaseBusinessIcon className="h-3 w-3" />
                  {job.job_type}
                </Badge>
                {job.experience_level && (
                  <Badge variant="secondary" className="gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {job.experience_level}
                  </Badge>
                )}
                {job.salary_range && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSignIcon className="h-3 w-3" />
                    {job.salary_range}
                  </Badge>
                )}
                {job.positions_available && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {job.positions_available} positions
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveToggle}
              >
                {isSaved ? (
                  <BookmarkCheckIcon className="h-5 w-5 fill-current" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Application Status Banner */}
          {applied ? (
            <div className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success/40 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2Icon className="h-5 w-5 text-success" />
              <div>
                <p className="font-semibold text-success dark:text-success">Application Submitted</p>
                <p className="text-sm text-success dark:text-success">
                  You have already applied to this position. Check your applications page for updates.
                </p>
              </div>
            </div>
          ) : isDeadlinePassed ? (
            <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg p-4 flex items-center gap-3">
              <WarningCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive dark:text-destructive">Application Deadline Passed</p>
                <p className="text-sm text-destructive dark:text-destructive" suppressHydrationWarning>
                  The deadline for this position was {mounted ? formatDate(job.application_deadline!) : '...'}
                </p>
              </div>
            </div>
          ) : job.application_deadline && (
            <div className="bg-info/10 dark:bg-info/20 border border-info/30 dark:border-info/40 rounded-lg p-4 flex items-center gap-3">
              <Info className="h-5 w-5 text-info" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="font-semibold text-info dark:text-info">Application Deadline</p>
                  <p className="text-sm text-info dark:text-info" suppressHydrationWarning>
                    Applications close on {mounted ? formatDate(job.application_deadline) : '...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => setIsApplyDialogOpen(true)}
              disabled={applied || isDeadlinePassed}
            >
              <PaperPlaneTilt className="h-4 w-4 mr-2" />
              {applied ? 'Already Applied' : 'Apply Now'}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              asChild
            >
              <Link href="/student/applications" prefetch={true}>View My Applications</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {/* Responsibilities */}
      {job.responsibilities && job.responsibilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2Icon className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{responsibility}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Required Skills */}
      {(job.required_skills || job.skills_required) && (job.required_skills || job.skills_required)!.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(job.required_skills || job.skills_required)!.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualifications */}
      {job.qualifications && job.qualifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.qualifications.map((qualification, index) => (
                <li key={index} className="flex items-start gap-2">
                  <GraduationCap className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{qualification}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      {job.benefits && job.benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2Icon className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <PaperPlaneTilt className="h-6 w-6 text-info" />
              Apply for {job.title}
            </DialogTitle>
            <DialogDescription>
              {job.company_name || job.company} • {job.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Job Type:</span>
                <span className="font-medium">{job.job_type}</span>
              </div>
              {job.experience_level && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience Level:</span>
                  <span className="font-medium">{job.experience_level}</span>
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salary Range:</span>
                  <span className="font-medium">{job.salary_range}</span>
                </div>
              )}
              {job.application_deadline && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium text-destructive" suppressHydrationWarning>
                    {mounted ? formatDate(job.application_deadline) : '...'}
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
              <PaperPlaneTilt className="h-4 w-4 mr-2" />
              {isApplying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
