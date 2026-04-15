'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, Clock, WarningCircle, FileText, UploadSimple as Upload } from '@phosphor-icons/react'

interface StudentAssignmentsClientProps {
  assignments: any[]
  studentId: string
  org: string
}

export function StudentAssignmentsClient({ assignments: initialAssignments, studentId, org }: StudentAssignmentsClientProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [searchTerm, setSearchTerm] = useState('')

  const normalizedSearch = searchTerm.toLowerCase()

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title?.toLowerCase()?.includes(normalizedSearch) ||
                         a.course?.toLowerCase()?.includes(normalizedSearch)
    if (filter === 'all') return matchesSearch
    return matchesSearch && a.status === filter
  })

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    graded: assignments.filter(a => a.status === 'graded').length
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/45'
      case 'submitted':
        return 'bg-info/15 text-info border-info/40'
      case 'graded':
        return 'bg-success/15 text-success border-success/40'
      default:
        return 'bg-muted text-muted-foreground border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
        return <WarningCircle className="h-4 w-4" />
      case 'submitted':
        return <Clock className="h-4 w-4" />
      case 'graded':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <WarningCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.graded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search assignments by title or course..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(val: any) => setFilter(val)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
            <p className="text-sm text-muted-foreground">You have no assignments in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className={`border-l-4 ${getStatusColor(assignment.status)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(assignment.status)}
                      <CardTitle>{assignment.title}</CardTitle>
                    </div>
                    <CardDescription>{assignment.course} • {assignment.type}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{assignment.maxPoints} pts</p>
                    {assignment.status === 'graded' && (
                      <p className="text-lg font-bold text-success">{assignment.grade}/{assignment.maxPoints}</p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                  </div>
                  {assignment.status === 'graded' && assignment.feedback && (
                    <div>
                      <p className="text-muted-foreground">Feedback</p>
                      <p className="text-sm italic">{assignment.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setIsDetailDialogOpen(true)
                    }}
                  >
                    View Details
                  </Button>
                  {assignment.status === 'pending' && (
                    <Button size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Submit Assignment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>{selectedAssignment?.course}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedAssignment?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(selectedAssignment?.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Points</p>
                <p className="font-medium">{selectedAssignment?.maxPoints}</p>
              </div>
            </div>

            {selectedAssignment?.status === 'graded' && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <p className="font-medium mb-2">Grade: {selectedAssignment?.grade}/{selectedAssignment?.maxPoints}</p>
                <p className="text-sm">{selectedAssignment?.feedback}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
