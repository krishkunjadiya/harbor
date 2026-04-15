import { InterviewSchedulingClient } from './interview-scheduling-client'
import { getAllApplicationsForRecruiter, getInterviews } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function InterviewSchedulingPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])

  const [interviews, applicationsData] = await Promise.all([
    getInterviews(profile.id, 'recruiter'),
    getAllApplicationsForRecruiter(profile.id, {
      page: 1,
      pageSize: 100,
    }),
  ])

  const initialApplications = (applicationsData.applications || []).map((application: any) => ({
    ...application,
    student: application.student?.profiles || application.student || null,
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Scheduling</h1>
        <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
      </div>

      <InterviewSchedulingClient
        interviews={interviews}
        recruiterId={profile.id}
        org={org}
        initialApplications={initialApplications}
      />
    </div>
  )
}
