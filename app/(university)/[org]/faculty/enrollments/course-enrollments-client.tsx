'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, BookOpen, DownloadSimple as Download, EnvelopeSimple as Envelope, ArrowSquareOut } from '@phosphor-icons/react'
import Link from 'next/link'
import { toast } from "sonner"

interface CourseEnrollmentsClientProps {
  enrollments: any[]
  org: string
}

export function CourseEnrollmentsClient({ enrollments: initialEnrollments, org }: CourseEnrollmentsClientProps) {
  const [enrollments] = useState(initialEnrollments)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [isStudentListDialogOpen, setIsStudentListDialogOpen] = useState(false)

  const uniqueCourses = enrollments.reduce((acc: any[], e) => {
    if (!acc.find((c: any) => c.id === e.courseId)) {
      acc.push({
        id: e.courseId,
        title: e.courseTitle,
        code: e.courseCode,
        enrollmentCount: enrollments.filter(en => en.courseId === e.courseId).length
      })
    }
    return acc
  }, [])

  const filteredCourses = uniqueCourses.filter((c: any) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const courseEnrollments = selectedCourse 
    ? enrollments.filter(e => 
        e.courseId === selectedCourse.id && 
        (e.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
         e.studentEmail.toLowerCase().includes(studentSearchTerm.toLowerCase()))
      )
    : []

  const handleExport = () => {
    if (!selectedCourse) return
    
    const dataToExport = enrollments.filter(e => e.courseId === selectedCourse.id)
    const csvContent = [
      ['Student Name', 'Email', 'Student ID', 'Enrollment Date', 'Status'],
      ...dataToExport.map(e => [e.studentName, e.studentEmail, e.studentId, e.enrollmentDate, e.status])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `enrollments_${selectedCourse.code}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Enrollment list exported successfully")
  }

  const stats = {
    totalCourses: uniqueCourses.length,
    totalEnrolled: enrollments.length,
    averageEnrollment: Math.round(enrollments.length / (uniqueCourses.length || 1))
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getEnrollmentStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-success/15 text-success'
      case 'dropped':
        return 'bg-destructive/15 text-destructive'
      case 'pending':
        return 'bg-warning/20 text-warning'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Course</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageEnrollment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Courses and Details */}
      <Tabs defaultValue="courses" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="courses" className="rounded-lg">Courses ({stats.totalCourses})</TabsTrigger>
          {selectedCourse && (
            <TabsTrigger value="students" className="rounded-lg">Students in {selectedCourse.code}</TabsTrigger>
          )}
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Input
            placeholder="Search by course code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                <p className="text-sm text-muted-foreground">You have no course enrollments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{course.title}</span>
                      <Badge variant="secondary">{course.code}</Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Enrolled Students</p>
                        <p className="text-2xl font-bold">{course.enrollmentCount}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedCourse(course)
                        setIsStudentListDialogOpen(true)
                      }}
                    >
                      View Enrollments
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        {selectedCourse && (
          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search students..."
                className="max-w-sm"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrollment No.</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${enrollment.studentName}`} />
                            <AvatarFallback>{getInitials(enrollment.studentName)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{enrollment.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Envelope className="h-3.5 w-3.5 text-muted-foreground" />
                          {enrollment.studentEmail}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{enrollment.enrollmentNumber}</TableCell>
                      <TableCell>{enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getEnrollmentStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${org}/faculty/students/${enrollment.studentId}`} className="gap-1">
                            <ArrowSquareOut className="h-3.5 w-3.5" />
                            View Profile
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Student List Dialog */}
      <Dialog open={isStudentListDialogOpen} onOpenChange={setIsStudentListDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2">Student Enrollments - {selectedCourse?.title}</DialogTitle>
            <DialogDescription>All students enrolled in this course</DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                  <TableCell>{enrollment.studentEmail}</TableCell>
                  <TableCell>
                    <Badge className={getEnrollmentStatusColor(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${org}/faculty/students/${enrollment.studentId}`}>View Profile</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  )
}
