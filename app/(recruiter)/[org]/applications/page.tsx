import { getAllApplicationsForRecruiter } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { JobApplicationsClient } from './applications-client'

type ApplicationFilter = 'all' | 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'

const VALID_FILTERS: ApplicationFilter[] = ['all', 'pending', 'reviewing', 'shortlisted', 'rejected', 'accepted']

function normalizeFilter(filter?: string): ApplicationFilter {
  if (filter && VALID_FILTERS.includes(filter as ApplicationFilter)) {
    return filter as ApplicationFilter
  }
  return 'all'
}

export default async function RecruiterApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const profile = await requireRouteUserType(['recruiter'])

  const { org } = await params
  const { filter } = await searchParams
  const initialFilter = normalizeFilter(filter)
  const applicationsData = await getAllApplicationsForRecruiter(profile.id, {
    page: 1,
    pageSize: 100,
  })

  const initialApplications = (applicationsData.applications || []).map((application: any) => ({
    ...application,
    student: application.student?.profiles || application.student || null,
  }))

  return (
    <div className="space-y-6">
      <JobApplicationsClient
        recruiterId={profile.id}
        org={org}
        initialFilter={initialFilter}
        initialApplications={initialApplications}
      />
    </div>
  )
}

