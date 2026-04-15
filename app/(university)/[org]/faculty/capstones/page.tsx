import { CapstoneClient } from './capstones-client'
import { getProjectsByFaculty } from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CapstonesPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${org}/login`)
  }

  const projectsData = await getProjectsByFaculty(user.id)

  // Transform database projects to component format
  const transformedCapstones = projectsData.map((p: any) => ({
    id: p.id,
    title: p.title,
    course: p.course_name || 'General Capstone',
    team: p.team_members || [],
    studentIds: p.student_ids || [],
    mentor: p.mentor || 'TBA',
    status: p.status || 'in-progress',
    progress: p.progress || 0,
    startDate: p.start_date,
    dueDate: p.end_date,
    presentation: p.presentation_date,
    tags: p.tags || [],
    score: p.grade,
    milestones: {
      proposal: p.proposal_status || 'pending',
      midterm: p.midterm_status || 'pending',
      final: p.final_status || 'pending'
    }
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <CapstoneClient initialCapstones={transformedCapstones} />
    </div>
  )
}
