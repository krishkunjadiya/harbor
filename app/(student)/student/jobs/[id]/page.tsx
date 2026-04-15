import { notFound } from "next/navigation"
import { getJobById, getJobApplications } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { JobDetailClient } from "@/app/(student)/student/jobs/[id]/job-detail-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJobById(id)
  
  if (!job) {
    return {
      title: 'Job Not Found | Harbor'
    }
  }
  
  return {
    title: `${job.title} - ${(job as any).company_name || 'Company'} | Harbor`,
    description: job.description }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireRouteUserType(['student'])

  const [job, applications] = await Promise.all([
    getJobById(id),
    getJobApplications(profile.id)
  ])

  if (!job) {
    notFound()
  }

  // Check if already applied
  const hasApplied = applications.some(app => app.job_id === job.id)

  return (
    <div className="space-y-6">
      <JobDetailClient 
        job={job as any} 
        studentId={profile.id}
        hasApplied={hasApplied}
      />
    </div>
  )
}

