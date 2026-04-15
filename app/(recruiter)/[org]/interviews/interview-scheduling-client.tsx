'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, VideoCamera as Video, MapPin, User, Plus as PlusIcon, SpinnerGap as Loader2Icon } from '@phosphor-icons/react'
import { cancelInterview, createInterview, rescheduleInterview } from '@/lib/actions/mutations'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRealtimeJobApplications } from '@/lib/hooks/useRealtime'
import { formatDateUTC, formatTimeUTC } from '@/lib/utils/date-format'

interface InterviewSchedulingClientProps {
  interviews: any[]
  recruiterId: string
  org: string
  initialApplications?: any[]
}

interface InterviewCardData {
  id: string
  candidateName: string
  position: string
  date: string
  time: string
  duration: number
  type: string
  location: string
  status: string
}

const encodeCandidateSelection = (candidateId: string, jobId: string) =>
  JSON.stringify({ candidateId, jobId })

const decodeCandidateSelection = (value: string): { candidateId: string; jobId: string } | null => {
  try {
    const parsed = JSON.parse(value)
    if (
      parsed &&
      typeof parsed.candidateId === 'string' &&
      typeof parsed.jobId === 'string'
    ) {
      return { candidateId: parsed.candidateId, jobId: parsed.jobId }
    }
  } catch {
    return null
  }

  return null
}

const toInterviewCardData = (interview: any): InterviewCardData => ({
  id: interview.id,
  candidateName: interview.student?.full_name || interview.candidateName || 'Unknown Candidate',
  position: interview.job?.title || interview.position || 'General Interview',
  date: interview.scheduled_at || interview.date,
  time: formatTimeUTC(interview.scheduled_at || interview.date),
  duration: interview.duration_min || interview.duration || 60,
  type: interview.meeting_link?.includes('http') ? 'video' : (interview.type || 'in-person'),
  location: interview.meeting_link || interview.location || 'TBD',
  status: interview.status
})

const toDateInputValue = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const toTimeInputValue = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(11, 16)
}

const buildActionErrorMessage = (resultError?: string, fallback?: string) => {
  if (typeof resultError === 'string' && resultError.trim()) {
    return resultError
  }

  return fallback || 'Something went wrong. Please try again.'
}

export function InterviewSchedulingClient({
  interviews: initialInterviews,
  recruiterId,
  org,
  initialApplications = [],
}: InterviewSchedulingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { applications } = useRealtimeJobApplications(recruiterId, initialApplications)
  
  const transformedInterviews = useMemo(
    () => initialInterviews.map(toInterviewCardData),
    [initialInterviews]
  )

  // Get eligible candidates (shortlisted or accepted)
  const eligibleCandidates = useMemo(() => {
    return applications
      .filter(app => app.status === 'shortlisted' || app.status === 'accepted')
      .map(app => ({
        studentId: app.student_id,
        name: (app.student as any)?.full_name || 'Unknown Candidate',
        jobId: app.job_id,
        position: (app.job as any)?.title || 'General Interview'
      }))
  }, [applications])

  const [interviews, setInterviews] = useState(transformedInterviews)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<InterviewCardData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancellingInterviewId, setIsCancellingInterviewId] = useState<string | null>(null)
  const [isReschedulingInterviewId, setIsReschedulingInterviewId] = useState<string | null>(null)
  const [newInterview, setNewInterview] = useState({
    candidateName: '',
    candidateId: '',
    position: '',
    jobId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'video',
    location: ''
  })
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    location: ''
  })

  useEffect(() => {
    setInterviews(transformedInterviews)
  }, [transformedInterviews])

  // Pre-fill from query parameters
  useEffect(() => {
    const candidateIdParam = searchParams?.get('candidateId')
    const jobIdParam = searchParams?.get('jobId')

    if (candidateIdParam) {
      let resolvedCandidate = null as (typeof eligibleCandidates)[number] | null

      if (jobIdParam) {
        resolvedCandidate = eligibleCandidates.find(
          c => c.studentId === candidateIdParam && c.jobId === jobIdParam
        ) || null
      } else {
        const matches = eligibleCandidates.filter(c => c.studentId === candidateIdParam)
        if (matches.length === 1) {
          resolvedCandidate = matches[0]
        }
      }

      setNewInterview(prev => ({
        ...prev,
        candidateId: candidateIdParam,
        candidateName: resolvedCandidate?.name || searchParams?.get('candidateName') || '',
        position: resolvedCandidate?.position || searchParams?.get('position') || '',
        jobId: resolvedCandidate?.jobId || jobIdParam || ''
      }))
      setIsCreateDialogOpen(true)
    }
  }, [searchParams, eligibleCandidates])

  const handleCandidateChange = (candidateJobValue: string) => {
    const parsedSelection = decodeCandidateSelection(candidateJobValue)
    if (!parsedSelection) {
      setNewInterview(prev => ({
        ...prev,
        candidateId: '',
        candidateName: '',
        position: '',
        jobId: ''
      }))
      return
    }

    const selected = eligibleCandidates.find(
      c => c.studentId === parsedSelection.candidateId && c.jobId === parsedSelection.jobId
    )
    if (selected) {
      setNewInterview(prev => ({
        ...prev,
        candidateId: selected.studentId,
        candidateName: selected.name,
        position: selected.position,
        jobId: selected.jobId
      }))
    } else {
      setNewInterview(prev => ({
        ...prev,
        candidateId: '',
        candidateName: '',
        position: '',
        jobId: ''
      }))
    }
  }

  const handleSchedule = async () => {
    if (!newInterview.candidateId || !newInterview.jobId) {
      alert('Please select a valid candidate and job before scheduling.')
      return
    }

    if (!newInterview.date || !newInterview.time) {
      alert('Please provide both date and time for the interview.')
      return
    }

    const duration = Number.parseInt(newInterview.duration, 10)
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      alert('Duration must be between 15 and 480 minutes.')
      return
    }

    const scheduledAtDate = new Date(`${newInterview.date}T${newInterview.time}`)
    if (Number.isNaN(scheduledAtDate.getTime())) {
      alert('Please provide a valid interview date and time.')
      return
    }

    setIsSubmitting(true)
    try {
      const scheduledAt = scheduledAtDate.toISOString()
      
      const result = await createInterview({
        recruiter_id: recruiterId,
        student_id: newInterview.candidateId, // Use exact ID if available
        candidate_name: newInterview.candidateName,
        job_id: newInterview.jobId,
        position: newInterview.position,
        scheduled_at: scheduledAt,
        duration_min: duration,
        type: newInterview.type,
        location: newInterview.location
      })

      if (result.success) {
        alert('Interview scheduled successfully!')
        setIsCreateDialogOpen(false)
        router.refresh()

        const interview = toInterviewCardData({
          id: result.data?.id || Date.now().toString(),
          candidateName: newInterview.candidateName,
          position: newInterview.position,
          scheduled_at: scheduledAt,
          duration_min: duration,
          type: newInterview.type,
          meeting_link: newInterview.location,
          status: 'scheduled'
        })
        setInterviews(prev => [interview, ...prev])
      } else {
        alert(buildActionErrorMessage(result.error, 'Failed to schedule interview.'))
      }
    } catch (error) {
      console.error(error)
      alert('Failed to schedule interview')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (interview: InterviewCardData) => {
    setSelectedInterview(interview)
    setIsDetailsDialogOpen(true)
  }

  const handleOpenReschedule = (interview: InterviewCardData) => {
    setSelectedInterview(interview)
    setRescheduleForm({
      date: toDateInputValue(interview.date),
      time: toTimeInputValue(interview.date),
      location: interview.location === 'TBD' ? '' : interview.location
    })
    setIsRescheduleDialogOpen(true)
  }

  const handleReschedule = async () => {
    if (!selectedInterview) return

    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert('Please provide both date and time for rescheduling.')
      return
    }

    const scheduledAtDate = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`)
    if (Number.isNaN(scheduledAtDate.getTime())) {
      alert('Please provide a valid interview date and time.')
      return
    }

    setIsReschedulingInterviewId(selectedInterview.id)
    try {
      const scheduledAt = scheduledAtDate.toISOString()
      const result = await rescheduleInterview({
        interview_id: selectedInterview.id,
        recruiter_id: recruiterId,
        scheduled_at: scheduledAt,
        location: rescheduleForm.location
      })

      if (!result.success) {
        alert(buildActionErrorMessage(result.error, 'Failed to reschedule interview.'))
        return
      }

      const updatedInterview = toInterviewCardData({
        ...result.data,
        candidateName: selectedInterview.candidateName,
        position: selectedInterview.position,
        duration_min: result.data?.duration_min ?? selectedInterview.duration,
        meeting_link: result.data?.meeting_link ?? selectedInterview.location
      })
      setInterviews(prev => prev.map(i => (i.id === updatedInterview.id ? { ...i, ...updatedInterview } : i)))
      setIsRescheduleDialogOpen(false)
      setSelectedInterview(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to reschedule interview')
    } finally {
      setIsReschedulingInterviewId(null)
    }
  }

  const handleCancelInterview = async (interview: InterviewCardData) => {
    const confirmed = window.confirm(`Cancel interview with ${interview.candidateName}?`)
    if (!confirmed) return

    setIsCancellingInterviewId(interview.id)
    try {
      const result = await cancelInterview({
        interview_id: interview.id,
        recruiter_id: recruiterId
      })

      if (!result.success) {
        alert(buildActionErrorMessage(result.error, 'Failed to cancel interview.'))
        return
      }

      setInterviews(prev => prev.map(i => (i.id === interview.id ? { ...i, status: 'cancelled' } : i)))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to cancel interview')
    } finally {
      setIsCancellingInterviewId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-info/15 text-info'
      case 'completed': return 'bg-success/15 text-success'
      case 'cancelled': return 'bg-destructive/15 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Schedule Interview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>Set up an interview with a shortlisted or accepted candidate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Candidate Name</Label>
                <select 
                  className="w-full px-3 py-2 border rounded-md" 
                  value={newInterview.candidateId && newInterview.jobId
                    ? encodeCandidateSelection(newInterview.candidateId, newInterview.jobId)
                    : ''}
                  onChange={(e) => handleCandidateChange(e.target.value)}
                >
                  <option value="">Select a candidate...</option>
                  {eligibleCandidates.map(c => (
                    <option
                      key={`${c.studentId}-${c.jobId}`}
                      value={encodeCandidateSelection(c.studentId, c.jobId)}
                    >
                      {c.name} ({c.position})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input placeholder="Software Engineer" value={newInterview.position} onChange={(e) => setNewInterview({...newInterview, position: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newInterview.date} onChange={(e) => setNewInterview({...newInterview, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={newInterview.time} onChange={(e) => setNewInterview({...newInterview, time: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={newInterview.duration} onChange={(e) => setNewInterview({...newInterview, duration: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="w-full px-3 py-2 border rounded-md" value={newInterview.type} onChange={(e) => setNewInterview({...newInterview, type: e.target.value})}>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location/Link</Label>
                <Input placeholder="Meeting link or location" value={newInterview.location} onChange={(e) => setNewInterview({...newInterview, location: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
            <DialogDescription>Review this scheduled interview information.</DialogDescription>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Candidate</span><span>{selectedInterview.candidateName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span>{selectedInterview.position}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDateUTC(selectedInterview.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{selectedInterview.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{selectedInterview.duration} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{selectedInterview.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location/Link</span><span>{selectedInterview.location}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={getStatusColor(selectedInterview.status)}>{selectedInterview.status}</Badge></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>Update the interview date, time, and location.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Location/Link</Label>
              <Input
                value={rescheduleForm.location}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Meeting link or location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)} disabled={Boolean(isReschedulingInterviewId)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={Boolean(isReschedulingInterviewId)}>
              {isReschedulingInterviewId ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Interviews</h3>
            <p className="text-sm text-muted-foreground">Schedule your first interview</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {interview.candidateName}
                    </CardTitle>
                    <CardDescription>{interview.position}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(interview.status)}>{interview.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateUTC(interview.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{interview.time} ({interview.duration} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {interview.type === 'video' && <Video className="h-4 w-4 text-muted-foreground" />}
                    {interview.type === 'in-person' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    <span className="capitalize">{interview.type}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(interview)}>View Details</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReschedule(interview)}
                    disabled={interview.status === 'cancelled'}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleCancelInterview(interview)}
                    disabled={interview.status === 'cancelled' || isCancellingInterviewId === interview.id}
                  >
                    {isCancellingInterviewId === interview.id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
