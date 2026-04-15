'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BookOpen, CheckCircle, Clock, Users, Calendar } from '@phosphor-icons/react'

interface StudentEnrollmentClientProps {
  availableCourses: any[]
  enrolledCourses: any[]
  studentId: string
  org: string
}

export function StudentEnrollmentClient({ 
  availableCourses: initialAvailable, 
  enrolledCourses: initialEnrolled,
  studentId,
  org
}: StudentEnrollmentClientProps) {
  const [availableCourses, setAvailableCourses] = useState(initialAvailable)
  const [enrolledCourses, setEnrolledCourses] = useState(initialEnrolled)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const normalizedSearch = searchTerm.toLowerCase()

  const handleEnroll = (courseId: string) => {
    const course = availableCourses.find(c => c.id === courseId)
    if (course) {
      setEnrolledCourses([...enrolledCourses, { ...course, enrolledAt: new Date().toISOString() }])
      setAvailableCourses(availableCourses.filter(c => c.id !== courseId))
    }
  }

  const handleDrop = (courseId: string) => {
    const course = enrolledCourses.find(c => c.id === courseId)
    if (course) {
      setAvailableCourses([...availableCourses, course])
      setEnrolledCourses(enrolledCourses.filter(c => c.id !== courseId))
    }
  }

  const filteredAvailableCourses = availableCourses.filter(c =>
    c.title?.toLowerCase()?.includes(normalizedSearch) ||
    c.code?.toLowerCase()?.includes(normalizedSearch)
  )

  const stats = {
    enrolled: enrolledCourses.length,
    available: availableCourses.length,
    totalCredits: enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Enrolled and Available */}
      <Tabs defaultValue="enrolled">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled ({stats.enrolled})</TabsTrigger>
          <TabsTrigger value="available">Available ({stats.available})</TabsTrigger>
        </TabsList>

        {/* Enrolled Courses Tab */}
        <TabsContent value="enrolled" className="space-y-4">
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Enrolled Courses</h3>
                <p className="text-sm text-muted-foreground">Enroll in courses from the Available tab</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrolledCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.code}</CardDescription>
                      </div>
                      <Badge variant="default">{course.credits} CR</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{course.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Instructor</p>
                          <p className="font-medium">{course.instructor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Schedule</p>
                          <p className="font-medium">{course.schedule}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCourse(course)
                          setIsDetailDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDrop(course.id)}
                      >
                        Drop Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Courses Tab */}
        <TabsContent value="available" className="space-y-4">
          <Input
            placeholder="Search by course code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {filteredAvailableCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Available Courses</h3>
                <p className="text-sm text-muted-foreground">All courses have been enrolled or none match your search</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAvailableCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.code}</CardDescription>
                      </div>
                      <Badge variant="outline">{course.credits} CR</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{course.description}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{course.enrolled || 0}/{course.capacity || 50}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{course.schedule}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCourse(course)
                          setIsDetailDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.title}</DialogTitle>
            <DialogDescription>{selectedCourse?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedCourse?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-medium">{selectedCourse?.instructor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="font-medium">{selectedCourse?.credits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schedule</p>
                <p className="font-medium">{selectedCourse?.schedule}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{selectedCourse?.location}</p>
              </div>
            </div>

            {selectedCourse?.prerequisites && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Prerequisites</p>
                <p className="text-sm font-medium">{selectedCourse.prerequisites}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
