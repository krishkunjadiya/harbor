import Link from "next/link"
import { notFound } from "next/navigation"
import { X } from "@phosphor-icons/react/dist/ssr"
import { getJobById, getJobApplications } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { JobDetailClient } from "@/app/(student)/student/jobs/[id]/job-detail-client"

export default async function JobDetailModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireRouteUserType(['student'])

  const [job, applications] = await Promise.all([
    getJobById(id),
    getJobApplications(profile.id),
  ])

  if (!job) {
    notFound()
  }

  const hasApplied = applications.some((app) => app.job_id === job.id)

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm md:p-8">
      <div className="relative w-full max-w-5xl rounded-xl border bg-background p-4 shadow-2xl md:p-6">
        <Link
          href="/student/jobs"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close job details"
        >
          <X className="h-4 w-4" />
        </Link>

        <JobDetailClient
          job={job as any}
          studentId={profile.id}
          hasApplied={hasApplied}
        />
      </div>
    </div>
  )
}
