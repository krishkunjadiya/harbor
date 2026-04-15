import { searchStudents } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import SearchClient from "./search-client"

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default async function CandidateSearchPage({
  params,
  searchParams }: {
  params: Promise<{ org: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireRouteUserType(['recruiter'])
  const { org } = await params
  const resolvedSearchParams = await searchParams

  const searchTerm = getFirstParam(resolvedSearchParams.q).trim()
  const students = await searchStudents(searchTerm, 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Search Candidates</h1>
        <p className="text-muted-foreground">Find and connect with talented students across the platform</p>
      </div>

      <SearchClient initialStudents={students} org={org} initialSearchTerm={searchTerm} />
    </div>
  )
}
