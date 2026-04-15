import { CourseEnrollmentsClient } from './course-enrollments-client'
import { getCourseEnrollmentsByFaculty } from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react/dist/ssr"


export default async function CourseEnrollmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${org}/login`)
  }
  
  const enrollments = await getCourseEnrollmentsByFaculty(user.id)

  // Transform enrollments to expected format
  const transformedEnrollments = enrollments.map((e: any) => ({
    id: e.id,
    courseId: e.course?.id || e.course_id,
    courseCode: e.course?.code || e.course?.course_code || 'Unknown',
    courseTitle: e.course?.name || e.course?.course_name || 'Unknown Course',
    studentId: e.student?.id || e.student_id,
    studentName: e.student?.full_name || 'Unknown Student',
    studentEmail: e.student?.email || '',
    studentAvatar: e.student?.avatar_url || '',
    enrollmentNumber: e.student_enrollment_number || e.student?.enrollment_number || 'N/A',
    enrollmentDate: e.enrollment_date,
    status: e.status || 'active',
    grade: e.grade || null
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Course Enrollments" icon={FacultyIcon} />
        <p className="text-muted-foreground">View and manage student enrollments in your courses</p>
      </div>

      <CourseEnrollmentsClient enrollments={transformedEnrollments} org={org} />
    </div>
  )
}


