"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Calendar, MagnifyingGlass, Plus as PlusIcon, PencilSimple, TrendUp, FileText, Clock, ChartBar } from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  getCoursesByFaculty,
  getCourseMaterials,
  uploadCourseMaterial,
  createCourseAction,
  updateCourseAction,
  createAssignment,
} from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function CoursesPage() {
  const params = useParams()
  const router = useRouter()
  const org = params?.org as string
  
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createCourseModal, setCreateCourseModal] = useState(false)
  const [editCourseModal, setEditCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [materialsModal, setMaterialsModal] = useState(false)
  const [studentsModal, setStudentsModal] = useState(false)
  const [assignmentModal, setAssignmentModal] = useState(false)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/${org}/login`)
      return
    }
    
    try {
      const coursesData = await getCoursesByFaculty(user.id)
      
      const transformedCourses = coursesData.map((c: any) => ({
        id: c.id,
        code: c.code || c.course_code || 'N/A',
        name: c.name || c.course_name || 'Unnamed Course',
        semester: c.semester || 'Spring 2026',
        students: c.enrolled_count ?? c.total_students ?? 0,
        capacity: c.max_students || c.capacity || 50,
        schedule: c.schedule || 'TBA',
        room: c.room || 'TBA',
        progress: c.progress || 0,
        assignments: c.assignment_count || 0,
        pendingGrades: c.pending_grades || 0,
        averageGrade: c.average_grade || 0,
      }))
      
      setCourses(transformedCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }, [router, org])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course)
    setEditCourseModal(true)
  }

  const handleSaveCourse = async (courseData: any) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: facultyProfile } = await supabase
        .from('faculty')
        .select('id, university_id')
        .eq('profile_id', user.id)
        .single()

      if (!facultyProfile) {
        toast.error('Faculty profile not found')
        return
      }

      if (selectedCourse) {
        const result = await updateCourseAction(selectedCourse.id, {
          course_code: courseData.code,
          course_name: courseData.name,
          schedule: courseData.schedule,
          room: courseData.room,
          max_students: courseData.capacity,
          updated_at: new Date().toISOString()
        })
        if (result) {
          toast.success("Course updated successfully")
          await fetchCourses()
        }
      } else {
        const result = await createCourseAction({
          course_code: courseData.code,
          course_name: courseData.name,
          schedule: courseData.schedule,
          room: courseData.room,
          max_students: courseData.capacity,
          instructor_id: facultyProfile.id,
          university_id: facultyProfile.university_id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        if (result) {
          toast.success("Course created successfully")
          await fetchCourses()
        }
      }
      
      setEditCourseModal(false)
      setCreateCourseModal(false)
      setSelectedCourse(null)
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error("An error occurred while saving")
    }
  }

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <DashboardHeader title="Courses" icon={FacultyIcon} />
          <p className="text-muted-foreground">Manage your courses and track student progress</p>
        </div>
        <Dialog open={createCourseModal} onOpenChange={setCreateCourseModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-x-2">Create New Course</DialogTitle>
              <DialogDescription>Add a new course to your teaching schedule</DialogDescription>
            </DialogHeader>
            <CreateCourseForm onSave={handleSaveCourse} onCancel={() => setCreateCourseModal(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.students, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              / {courses.reduce((sum, c) => sum + c.capacity, 0)} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.pendingGrades, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Submissions to grade</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by code or name..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-7 w-7 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{course.code}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          course.students / course.capacity >= 0.9 
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}>
                          {course.students}/{course.capacity} students
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{course.name}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {course.schedule}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Room:</span>
                        {course.room}
                      </div>
                    </div>
                  </div>
                </div>

                <Dialog open={editCourseModal && selectedCourse?.id === course.id} onOpenChange={(open) => !open && setEditCourseModal(false)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleEditCourse(course)}>
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-x-2">Edit Course</DialogTitle>
                      <DialogDescription>Update course details and schedule</DialogDescription>
                    </DialogHeader>
                    {selectedCourse && <CreateCourseForm initialData={selectedCourse} onSave={handleSaveCourse} onCancel={() => setEditCourseModal(false)} />}
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="overview" className="space-y-5">
                <TabsList className="h-auto w-fit flex-wrap gap-1 rounded-xl border bg-background p-1">
                  <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                  <TabsTrigger value="students" className="rounded-lg">Students</TabsTrigger>
                  <TabsTrigger value="assignments" className="rounded-lg">Assignments</TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendUp className="h-4 w-4" />
                        Progress
                      </div>
                      <div className="text-lg font-semibold">{course.progress}%</div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${course.progress}%` }} 
                        />
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        Assignments
                      </div>
                      <div className="text-lg font-semibold">{course.assignments}</div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Pending
                      </div>
                      <div className="text-lg font-semibold">{course.pendingGrades}</div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <ChartBar className="h-4 w-4" />
                        Avg Grade
                      </div>
                      <div className="text-lg font-semibold">{course.averageGrade}%</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={materialsModal && selectedCourse?.id === course.id} onOpenChange={(open) => !open && setMaterialsModal(false)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2" onClick={() => setSelectedCourse(course)}>
                          <FileText className="h-4 w-4" />
                          View Materials
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-x-2">Course Materials</DialogTitle>
                          <DialogDescription>View and manage course materials for {course.code}</DialogDescription>
                        </DialogHeader>
                        <CourseMaterialsForm course={course} onClose={() => setMaterialsModal(false)} />
                      </DialogContent>
                    </Dialog>

                    <Dialog open={studentsModal && selectedCourse?.id === course.id} onOpenChange={(open) => !open && setStudentsModal(false)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2" onClick={() => setSelectedCourse(course)}>
                          <Users className="h-4 w-4" />
                          Manage Students
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-x-2">Manage Students</DialogTitle>
                          <DialogDescription>Add, remove, or update students in {course.code}</DialogDescription>
                        </DialogHeader>
                        <ManageStudentsForm course={course} onClose={() => setStudentsModal(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>

                <TabsContent value="students" className="space-y-3">
                  <div className="space-y-2">
                    <StudentListTab courseId={course.id} totalStudents={course.students} />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setSelectedCourse(course)
                      setStudentsModal(true)
                    }}
                  >
                    View All {course.students} Students
                  </Button>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-3">
                  <div className="p-6 border rounded-lg bg-muted/50 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-3">Manage Course Assignments</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {course.assignments} assignments for this course
                    </p>
                    <Dialog open={assignmentModal && selectedCourse?.id === course.id} onOpenChange={(open) => !open && setAssignmentModal(false)}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => setSelectedCourse(course)}>
                          <PlusIcon className="h-4 w-4" />
                          Create Assignment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-x-2">Create Assignment</DialogTitle>
                          <DialogDescription>Add a new assignment for {course.code}</DialogDescription>
                        </DialogHeader>
                        <CreateAssignmentForm course={course} onClose={() => setAssignmentModal(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 border rounded-lg p-4">
                      <h4 className="text-sm font-medium">Grade Distribution</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Student grades are calculated from submitted assignments
                      </p>
                      <div className="text-center py-6">
                        <ChartBar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">
                          Fetched from assignment submissions database
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border rounded-lg p-4">
                      <h4 className="text-sm font-medium">Course Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-xs">Students Enrolled</span>
                          <span className="text-xs font-semibold">{course.students}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-xs">Assignments</span>
                          <span className="text-xs font-semibold">{course.assignments}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-xs">Pending Grades</span>
                          <span className="text-xs font-semibold">{course.pendingGrades}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-xs">Course Progress</span>
                          <span className="text-xs font-semibold">{course.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No courses found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CreateCourseForm({ initialData, onSave, onCancel }: { initialData?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState(initialData || { code: '', name: '', schedule: '', room: '', capacity: 50 })

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Course Code</Label>
        <Input 
          value={formData.code} 
          onChange={(e) => handleChange('code', e.target.value)} 
          placeholder="e.g., CS401"
        />
      </div>
      <div>
        <Label>Course Name</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => handleChange('name', e.target.value)} 
          placeholder="e.g., Artificial Intelligence"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Schedule</Label>
          <Input 
            value={formData.schedule} 
            onChange={(e) => handleChange('schedule', e.target.value)} 
            placeholder="e.g., MWF 10-11am"
          />
        </div>
        <div>
          <Label>Room</Label>
          <Input 
            value={formData.room} 
            onChange={(e) => handleChange('room', e.target.value)} 
            placeholder="e.g., Room 301"
          />
        </div>
      </div>
      <div>
        <Label>Capacity</Label>
        <Input 
          type="number" 
          value={formData.capacity} 
          onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)} 
          placeholder="50"
        />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save Course</Button>
      </div>
    </div>
  )
}

function CourseMaterialsForm({ course, onClose }: { course: any; onClose: () => void }) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: '', type: 'PDF' })

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const data = await getCourseMaterials(course.id)
    setMaterials(data)
    setLoading(false)
  }, [course.id])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const handleUpload = async () => {
    if (!newMaterial.title) {
      toast.error("Please enter a title")
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadCourseMaterial({
        course_id: course.id,
        title: newMaterial.title,
        file_type: newMaterial.type,
        file_url: '#'
      })

      if (result) {
        toast.success("Material uploaded successfully")
        await fetchMaterials()
        setNewMaterial({ title: '', type: 'PDF' })
      }
    } catch (err) {
      console.error('Error uploading:', err)
      toast.error("Failed to upload")
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {materials.length > 0 ? (
          materials.map((material) => (
            <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{material.title}</p>
                <p className="text-xs text-muted-foreground">{material.file_type} • {new Date(material.created_at).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="ghost">Download</Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No materials uploaded yet</p>
        )}
      </div>
      
      <div className="pt-4 border-t space-y-3">
        <h4 className="text-sm font-medium">Upload New Material</h4>
        <div className="space-y-2">
          <Input 
            placeholder="Material title" 
            value={newMaterial.title}
            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
          />
          <Select value={newMaterial.type} onValueChange={(val) => setNewMaterial({...newMaterial, type: val})}>
            <SelectTrigger>
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF Document</SelectItem>
              <SelectItem value="PPT">Presentation</SelectItem>
              <SelectItem value="Video">Video Link</SelectItem>
              <SelectItem value="Link">Web Resource</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Material"}
          </Button>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function ManageStudentsForm({ course, onClose }: { course: any; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const supabase = createClient()
        const { data: enrollments, error } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            student:profiles(id, full_name, email, avatar_url)
          `)
          .eq('course_id', course.id)

        if (error) {
          console.error('Error fetching students:', error)
          setStudents([])
        } else {
          const transformedStudents = (enrollments || []).map((enrollment: any) => ({
            id: enrollment.student_id,
            name: Array.isArray(enrollment.student) ? enrollment.student[0]?.full_name : enrollment.student?.full_name || 'Unknown Student',
            email: Array.isArray(enrollment.student) ? enrollment.student[0]?.email : enrollment.student?.email || 'N/A',
            grade: enrollment.grade || 'Not Graded',
            status: enrollment.status || 'active',
            enrollmentId: enrollment.id
          }))
          setStudents(transformedStudents)
        }
      } catch (err) {
        console.error('Error in fetchStudents:', err)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudents()
  }, [course.id])

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {students.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Grade</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{student.name}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{student.email}</td>
                  <td className="px-4 py-2 font-semibold">
                    {typeof student.grade === 'number' ? `${student.grade}%` : student.grade}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-success/15 text-success text-xs rounded capitalize">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="ghost" className="h-6 px-2">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No students enrolled in this course yet</p>
        </div>
      )}
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function CreateAssignmentForm({ course, onClose }: { course: any; onClose: () => void }) {
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', points: 100 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.dueDate) {
      toast.error("Please fill in required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createAssignment({
        course_id: course.id,
        title: formData.title,
        description: formData.description,
        due_date: formData.dueDate,
        max_points: formData.points,
        status: 'active',
        created_at: new Date().toISOString()
      } as any)

      if (result) {
        toast.success(`Assignment "${formData.title}" created successfully`)
        onClose()
      } else {
        toast.error("Failed to create assignment")
      }
    } catch (err) {
      console.error('Error creating assignment:', err)
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Assignment Title *</Label>
        <Input 
          value={formData.title} 
          onChange={(e) => handleChange('title', e.target.value)} 
          placeholder="e.g., Project 1 - Neural Networks"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea 
          value={formData.description} 
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter assignment details..."
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Due Date *</Label>
          <Input 
            type="datetime-local"
            value={formData.dueDate} 
            onChange={(e) => handleChange('dueDate', e.target.value)}
          />
        </div>
        <div>
          <Label>Points</Label>
          <Input 
            type="number" 
            value={formData.points} 
            onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)} 
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Assignment"}
        </Button>
      </div>
    </div>
  )
}

function StudentListTab({ courseId, totalStudents }: { courseId: string; totalStudents: number }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const supabase = createClient()
        const { data: enrollments, error } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            student:profiles(id, full_name, email, avatar_url)
          `)
          .eq('course_id', courseId)
          .limit(5)

        if (error) {
          console.error('Error fetching students:', error)
          setStudents([])
        } else {
          const transformedStudents = (enrollments || []).map((enrollment: any) => ({
            id: enrollment.student_id,
            name: Array.isArray(enrollment.student) ? enrollment.student[0]?.full_name : enrollment.student?.full_name || 'Unknown Student',
            email: Array.isArray(enrollment.student) ? enrollment.student[0]?.email : enrollment.student?.email || 'N/A',
            grade: enrollment.grade,
            status: enrollment.status || 'active'
          }))
          setStudents(transformedStudents)
        }
      } catch (err) {
        console.error('Error in fetchStudents:', err)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudents()
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <>
      {students.length > 0 ? (
        students.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-medium">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <span className="text-muted-foreground">Grade: </span>
                <span className="font-semibold">
                  {student.grade !== null && student.grade !== undefined ? `${student.grade}%` : 'Not Graded'}
                </span>
              </div>
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.status === 'active' 
                    ? 'bg-success/15 text-success'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No students enrolled yet</p>
        </div>
      )}
      {students.length > 0 && totalStudents > 5 && (
        <div className="text-center py-2 text-xs text-muted-foreground">
          Showing 5 of {totalStudents} students
        </div>
      )}
    </>
  )
}

