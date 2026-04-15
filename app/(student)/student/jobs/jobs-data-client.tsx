'use client'

import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { JobsClient } from './jobs-client'

type JobsPayload = {
  jobs: any[]
  applicationCount: number
  savedCount: number
}

async function fetchStudentJobsData(): Promise<JobsPayload> {
  const response = await fetch('/api/student/jobs', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load jobs')
  }

  return response.json()
}

export function StudentJobsDataClient({ studentId }: { studentId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['student', 'jobs-page-data', studentId],
    queryFn: fetchStudentJobsData,
    staleTime: 60 * 1000,
  })

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
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
          Failed to load jobs. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <JobsClient
      jobs={data.jobs}
      studentId={studentId}
      applicationCount={data.applicationCount}
      savedCount={data.savedCount}
    />
  )
}
