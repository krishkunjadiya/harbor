'use client'

import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationsClient } from './applications-client'

type ApplicationsPayload = {
  applications: any[]
}

async function fetchStudentApplicationsData(): Promise<ApplicationsPayload> {
  const response = await fetch('/api/student/applications', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load applications')
  }

  return response.json()
}

export function StudentApplicationsDataClient({ studentId }: { studentId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['student', 'applications-page-data', studentId],
    queryFn: fetchStudentApplicationsData,
    staleTime: 60 * 1000,
  })

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Failed to load applications. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  return <ApplicationsClient applications={data.applications} studentId={studentId} />
}
