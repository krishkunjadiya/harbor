import { AssignmentsClient } from './assignments-client'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react/dist/ssr"


export const metadata = {
  title: 'Assignments | Faculty Portal',
  description: 'Create and manage course assignments' }

export default async function AssignmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/${org}/login`)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Course Assignments" icon={FacultyIcon} />
        <p className="text-muted-foreground">Create, manage, and grade course assignments</p>
      </div>

      <AssignmentsClient facultyId={user.id} org={org} />
    </div>
  )
}


