"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, DownloadSimple as Download, ShieldCheck as ShieldCheckIcon, Calendar, TrendUp, BookOpen } from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect } from "react"
import { getAcademicRecords, getStudentTranscript } from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/header"
import { FileText as RecordsIcon } from "@phosphor-icons/react"


export default function StudentRecordsPage() {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecords() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      const [recordsData, transcriptData] = await Promise.all([
        getAcademicRecords(user.id),
        getStudentTranscript(user.id)
      ])
      
      // Transform to component format
      const transformedRecord = {
        id: user.id,
        studentName: transcriptData?.student_name || 'Current Student',
        studentId: user.id,
        department: transcriptData?.department || 'Unknown',
        year: transcriptData?.year || 'Current',
        gpa: transcriptData?.cgpa || 0,
        totalCredits: transcriptData?.total_credits || 0,
        courses: recordsData.map((r: any) => ({
          code: r.course_code,
          name: r.course_name,
          grade: r.grade,
          credits: r.credits,
          semester: r.semester
        })),
        verified: true
      }
      
      setRecord(transformedRecord)
      setLoading(false)
    }
    fetchRecords()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading academic records...</div>
  }

  if (!record) {
    return <div className="p-8 text-center text-muted-foreground">No academic records found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="My Academic Records" icon={RecordsIcon} />
        <p className="text-muted-foreground">View your transcript, grades, and academic achievements</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CGPA</CardTitle>
            <TrendUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{record.gpa}</div>
            <p className="text-xs text-muted-foreground">Cumulative Grade Point Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{record.totalCredits}</div>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{record.courses.length}</div>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>

      </div>

      {/* Main Record View */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">{record.studentName}</CardTitle>
                  {record.verified && (
                    <ShieldCheckIcon className="h-5 w-5 text-success" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{record.department}</span>
                  <span>•</span>
                  <span>{record.year}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => alert("Transcript downloading...")}>
              <Download className="h-4 w-4" />
              Download Transcript
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="courses" className="space-y-5">
            <TabsList className="h-auto w-fit flex-wrap gap-1 rounded-xl border bg-background p-1">
              <TabsTrigger value="courses" className="rounded-lg">Course History</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-3">
              <div className="space-y-2">
                {record.courses.map((course: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{course.code}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          course.grade.startsWith('A') ? 'bg-success/10 text-success' :
                          course.grade.startsWith('B') ? 'bg-info/10 text-info' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {course.grade}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{course.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{course.credits} credits</p>
                      <p className="text-xs text-muted-foreground">{course.semester}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

