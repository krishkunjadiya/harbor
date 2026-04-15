import { getRecruiterJobs } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import JobsPageClient from "./jobs-client"

export default async function JobsPage({ params }: { params: Promise<{ org: string }> }) {
  const profile = await requireRouteUserType(['recruiter'])

  const { org } = await params
  const jobs = await getRecruiterJobs(profile.id)

  return <JobsPageClient initialData={jobs} orgId={org} recruiterId={profile.id} />
}