import { redirect } from "next/navigation"
import { requireRouteUserType } from "@/lib/auth/route-context"

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

export default async function CandidatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireRouteUserType(["recruiter"])

  const { org } = await params
  const resolvedSearchParams = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item)
      }
      continue
    }

    if (value) query.set(key, value)
  }

  const status = getFirstParam(resolvedSearchParams.status)
  if (!query.has("filter") && status && status !== "all") {
    query.set("filter", status)
  }
  query.delete("status")

  const hasPipelineQuery = query.has("filter") || query.has("jobId") || query.has("fromDate") || query.has("toDate")
  const target = hasPipelineQuery
    ? (query.toString() ? `/${org}/applications?${query.toString()}` : `/${org}/applications`)
    : (query.toString() ? `/${org}/search?${query.toString()}` : `/${org}/search`)

  redirect(target)
}

