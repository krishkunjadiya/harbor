"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { File, CaretLeft, Plus as PlusIcon, DownloadSimple as Download, FileText, VideoCamera as Video, Link as LinkSimple } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function CourseMaterialsPage() {
  const params = useParams<{ org: string; courseId: string }>()
  const org = params?.org ?? ""
  const courseId = params?.courseId ?? ""
  
  const [materials, setMaterials] = useState<any[]>([])
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

        // Fetch materials
        const { data: materialsData } = await supabase
          .from('course_materials')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })

        setMaterials(materialsData || [])
      } catch (err) {
        console.error("Error fetching course materials:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'VIDEO': return <Video className="h-5 w-5 text-destructive" />
      case 'PDF': return <FileText className="h-5 w-5 text-warning" />
      case 'LINK': return <LinkSimple className="h-5 w-5 text-info" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
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
            <p className="text-muted-foreground">Learning Materials</p>
          </div>
        </div>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Upload Material
        </Button>
      </div>

      <div className="grid gap-4">
        {materials.length > 0 ? (
          materials.map((material) => (
            <Card key={material.id} className="group hover:border-primary transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      {getIcon(material.file_type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{material.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Added on {formatDate(material.created_at)} • {material.file_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <File className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <h3 className="text-lg font-medium">No materials yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              Share lecture notes, syllabus, or readings with your students.
            </p>
            <Button variant="outline" className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Upload first material
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
