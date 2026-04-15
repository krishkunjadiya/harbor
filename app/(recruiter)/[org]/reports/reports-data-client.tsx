'use client'

import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportsClient } from './reports-client'

type ReportsPayload = {
  recentReports: any[]
}

async function fetchRecentReports(): Promise<ReportsPayload> {
  const response = await fetch('/api/recruiter/reports/recent', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load reports')
  }

  return response.json()
}

export function RecruiterReportsDataClient({
  org,
  recruiterId,
  initialRecentReports = [],
}: {
  org: string
  recruiterId: string
  initialRecentReports?: any[]
}) {
  const initialPayload: ReportsPayload = { recentReports: initialRecentReports }

  const { data, isPending, isError } = useQuery({
    queryKey: ['recruiter', 'reports-recent', recruiterId],
    queryFn: fetchRecentReports,
    staleTime: 60 * 1000,
    initialData: initialPayload,
  })

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Failed to load reports. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  return <ReportsClient org={org} recruiterId={recruiterId} recentReports={data.recentReports} />
}
