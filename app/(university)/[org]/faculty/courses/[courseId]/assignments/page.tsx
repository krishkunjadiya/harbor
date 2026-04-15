"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, CaretLeft, Plus as PlusIcon, Calendar, Clock } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function CourseAssignmentsPage() {
  const params = useParams<{ org: string; courseId: string }>()
  const org = params?.org ?? ""
  const courseId = params?.courseId ?? ""
  
  const [assignments, setAssignments] = useState<any[]>([])
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

        // Fetch assignments
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .eq('course_id', courseId)
          .order('due_date', { ascending: true })

        setAssignments(assignmentsData || [])
      } catch (err) {
        console.error("Error fetching course assignments:", err)
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
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <p className="text-muted-foreground">Course Assignments</p>
          </div>
        </div>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Assignment
        </Button>
      </div>

      <div className="grid gap-4">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                  </div>
                  <Badge variant={new Date(assignment.due_date) < new Date() ? "secondary" : "default"}>
                    {new Date(assignment.due_date) < new Date() ? "Closed" : "Active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due: {formatDate(assignment.due_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Points: {assignment.max_points}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {assignment.assignment_type || 'Homework'}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${org}/faculty/assignments`}>View Submissions</Link>
                  </Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No assignments created for this course yet.</p>
            <Button variant="outline" className="mt-4 gap-2">
              <PlusIcon className="h-4 w-4" />
              Create First Assignment
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

