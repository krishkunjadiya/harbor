'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus as PlusIcon, FileText, CheckCircle, Clock, Users, WarningCircle, XCircle, Trash } from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getAssignmentsByFaculty, getCoursesByFaculty, createAssignment, deleteAssignment, getAssignmentSubmissions } from '@/lib/actions/database'

interface AssignmentsClientProps {
  facultyId: string
  org: string
}

export function AssignmentsClient({ facultyId, org }: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'closed'>('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null)

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    max_points: 100,
    assignment_type: 'homework'
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [assignmentsData, coursesData] = await Promise.all([
      getAssignmentsByFaculty(facultyId),
      getCoursesByFaculty(facultyId)
    ])
    setAssignments(assignmentsData)
    setCourses(coursesData)
    setLoading(false)
  }, [facultyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateAssignment = async () => {
    // Clear previous errors
    setError(null)

    // Validate required fields
    if (!newAssignment.title || newAssignment.title.trim() === '') {
      setError("Assignment title is required")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (!newAssignment.course_id) {
      setError("Please select a course")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (!newAssignment.due_date) {
      setError("Due date is required")
      setTimeout(() => setError(null), 5000)
      return
    }

    // Validate due date is in the future
    const dueDate = new Date(newAssignment.due_date)
    const now = new Date()
    if (dueDate < now) {
      setError("Due date must be in the future")
      setTimeout(() => setError(null), 5000)
      return
    }

    // Validate max points
    if (!newAssignment.max_points || newAssignment.max_points <= 0) {
      setError("Max points must be greater than 0")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (newAssignment.max_points > 1000) {
      setError("Max points cannot exceed 1000")
      setTimeout(() => setError(null), 5000)
      return
    }

    const result = await createAssignment(newAssignment)
    
    if (result) {
      setSuccess("Assignment created successfully")
      setTimeout(() => setSuccess(null), 5000)
      await loadData()
      setNewAssignment({
        title: '',
        description: '',
        course_id: '',
        due_date: '',
        max_points: 100,
        assignment_type: 'homework'
      })
      setIsCreateDialogOpen(false)
    } else {
      setError("Failed to create assignment")
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return
    
    const result = await deleteAssignment(assignmentToDelete.id)
    if (result) {
      setSuccess("Assignment deleted successfully")
      setTimeout(() => setSuccess(null), 5000)
      await loadData()
    } else {
      setError("Failed to delete assignment")
      setTimeout(() => setError(null), 5000)
    }
    setDeleteConfirmOpen(false)
    setAssignmentToDelete(null)
  }

  const confirmDelete = (assignment: any) => {
    setAssignmentToDelete(assignment)
    setDeleteConfirmOpen(true)
  }

  const handleViewSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment)
    const subs = await getAssignmentSubmissions(assignment.id)
    setSubmissions(subs)
    setIsSubmissionsDialogOpen(true)
  }

  const getAssignmentStatus = (dueDate: string) => {
    if (!dueDate) return 'upcoming'
    const due = new Date(dueDate)
    const now = new Date()
    
    if (due < now) return 'closed'
    if (due.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'active'
    return 'upcoming'
  }

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => getAssignmentStatus(a.due_date) === filter)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-success/10 border-success/30">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2">Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{assignmentToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Assignment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2">Create New Assignment</DialogTitle>
            <DialogDescription>Create a new assignment for your course</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Chapter 5 Problem Set"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={newAssignment.course_id} onValueChange={(val) => setNewAssignment({...newAssignment, course_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Assignment Type</Label>
                <Select value={newAssignment.assignment_type} onValueChange={(val) => setNewAssignment({...newAssignment, assignment_type: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPoints">Max Points</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  value={newAssignment.max_points}
                  onChange={(e) => setNewAssignment({...newAssignment, max_points: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Assignment details and instructions..."
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAssignment}>Create Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(val: any) => setFilter(val)}>
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-lg">Upcoming</TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active</TabsTrigger>
          <TabsTrigger value="closed" className="rounded-lg">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
            <p className="text-sm text-muted-foreground">Create your first assignment to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment.due_date)
            const statusColor = status === 'upcoming' ? 'bg-info/15 text-info' :
                              status === 'active' ? 'bg-warning/20 text-warning' :
                              'bg-muted text-muted-foreground'
            const submissionCount = assignment.submissions?.length || 0
            const gradedCount = assignment.submissions?.filter((s: any) => s.grade !== null).length || 0

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {assignment.course?.code || assignment.course?.course_code || 'N/A'} - {assignment.course?.name || assignment.course?.course_name || 'Course'} • {assignment.assignment_type} • {assignment.max_points} points
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                      {status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm font-medium">
                          {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Submissions</p>
                        <p className="text-sm font-medium">{submissionCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Graded</p>
                        <p className="text-sm font-medium">{gradedCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewSubmissions(assignment)}
                    >
                      View Submissions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => confirmDelete(assignment)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Submissions Dialog */}
      <Dialog open={isSubmissionsDialogOpen} onOpenChange={setIsSubmissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2">{selectedAssignment?.title} - Submissions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No submissions yet</p>
            ) : (
              submissions.map((submission: any) => (
                <div key={submission.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{submission.student?.full_name || submission.student_name || 'Student'}</h4>
                    <span className="text-sm text-muted-foreground">
                      {submission.grade !== null ? `${submission.grade}/${selectedAssignment?.max_points}` : 'Not graded'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(submission.submitted_at || submission.submittedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
