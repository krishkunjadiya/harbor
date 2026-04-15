import { StudentAssignmentsClient } from './student-assignments-client'
import { requireRouteUserType } from "@/lib/auth/route-context"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/header"
import { ClipboardText as AssignmentIcon } from "@phosphor-icons/react/dist/ssr"


async function getStudentAssignments(studentId: string) {
  const supabase = await createClient()
  
  // 1. Get enrolled course IDs
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id')
    .eq('student_id', studentId)
  
  const courseIds = enrollments?.map(e => e.course_id) || []
  
  if (courseIds.length === 0) return []

  // 2. Get assignments for these courses
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, course:courses(name, code)')
    .in('course_id', courseIds)
    .order('due_date', { ascending: true })

  // 3. Get student's submissions to determine status
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, status, grade')
    .eq('student_id', studentId)

  // 4. Merge data
  const assignmentsWithStatus = assignments?.map(assignment => {
    const submission = submissions?.find(s => s.assignment_id === assignment.id)
    return {
      ...assignment,
      status: submission?.status || (new Date(assignment.due_date) < new Date() ? 'overdue' : 'pending'),
      grade: submission?.grade,
      course_name: assignment.course?.name,
      course_code: assignment.course?.code
    }
  })

  return assignmentsWithStatus || []
}

export default async function StudentAssignmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['university'])

  const assignments = await getStudentAssignments(profile.id)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="My Assignments" icon={AssignmentIcon} />
          <p className="text-muted-foreground">View and submit your course assignments</p>
        </div>
      </div>

      <StudentAssignmentsClient assignments={assignments} studentId={profile.id} org={org} />
    </div>
  )
}

