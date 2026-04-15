"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, CaretLeft, EnvelopeSimple as Envelope } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function CourseStudentsPage() {
  const params = useParams<{ org: string; courseId: string }>()
  const router = useRouter()
  const org = params?.org ?? ""
  const courseId = params?.courseId ?? ""
  
  const [students, setStudents] = useState<any[]>([])
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Fetch course details
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
        
        setCourse(courseData)

        // Fetch enrollments
        const { data: enrollments, error } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            student:profiles(id, full_name, email, avatar_url)
          `)
          .eq('course_id', courseId)

        if (!error && enrollments) {
          const transformed = enrollments.map((e: any) => ({
            id: e.student_id,
            name: Array.isArray(e.student) ? e.student[0]?.full_name : e.student?.full_name || 'Unknown',
            email: Array.isArray(e.student) ? e.student[0]?.email : e.student?.email || 'N/A',
            status: e.status || 'active',
            grade: e.grade
          }))
          setStudents(transformed)
        }
      } catch (err) {
        console.error("Error fetching course students:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${org}/faculty/courses`}>
            <CaretLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <DashboardHeader title={<>
            {course?.course_code}: {course?.course_name}
          </>} icon={FacultyIcon} />
          <p className="text-muted-foreground">Enrolled Students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Roster ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Envelope className="h-3.5 w-3.5 text-muted-foreground" />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-success/15 text-success text-xs rounded capitalize">
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell>{student.grade || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${org}/faculty/students/${student.id}`}>View Profile</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No students enrolled in this course.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
