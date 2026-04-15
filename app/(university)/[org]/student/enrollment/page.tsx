import { StudentEnrollmentClient } from './student-enrollment-client'
import { getStudentProfile, getStudentCourses, getCoursesByUniversity } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/header"
import { UserPlus as EnrollmentIcon } from "@phosphor-icons/react/dist/ssr"


export default async function StudentEnrollmentPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['university'])

  const studentData = await getStudentProfile(profile.id)
  const student = studentData?.students
  
  if (!student) {
    return <div>Student profile not found</div>
  }

  // Fetch University ID based on student's university name
  // Note: ideally we would use the 'org' param if we had a slug-to-id lookup
  const supabase = await createClient()
  const { data: uniData } = await supabase
    .from('universities')
    .select('id')
    .ilike('university_name', student.university || '') // Case-insensitive match
    .single()

  const universityId = uniData?.id

  // Fetch data in parallel
  const [availableCourses, enrolledCourses] = await Promise.all([
    universityId ? getCoursesByUniversity(universityId) : Promise.resolve([]),
    getStudentCourses(profile.id)
  ])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="Course Enrollment" icon={EnrollmentIcon} />
          <p className="text-muted-foreground">Enroll in courses and manage your registrations</p>
        </div>
      </div>

      <StudentEnrollmentClient 
        availableCourses={availableCourses} 
        enrolledCourses={enrolledCourses}
        studentId={profile.id}
        org={org}
      />
    </div>
  )
}

