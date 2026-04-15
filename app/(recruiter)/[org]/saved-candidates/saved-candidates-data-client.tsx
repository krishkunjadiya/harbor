'use client'

import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SavedCandidatesClient } from './saved-candidates-client'

type SavedCandidatesPayload = {
  candidates: any[]
}

async function fetchSavedCandidates(): Promise<SavedCandidatesPayload> {
  const response = await fetch('/api/recruiter/saved-candidates', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load shortlisted candidates')
  }

  return response.json()
}

export function RecruiterSavedCandidatesDataClient({
  org,
  recruiterId,
  initialCandidates = [],
}: {
  org: string
  recruiterId: string
  initialCandidates?: any[]
}) {
  const initialPayload: SavedCandidatesPayload = { candidates: initialCandidates }

  const { data, isPending, isError } = useQuery({
    queryKey: ['recruiter', 'saved-candidates', recruiterId],
    queryFn: fetchSavedCandidates,
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
          Failed to load shortlisted candidates. Please refresh and try again.
        </CardContent>
      </Card>
    )
  }

  return <SavedCandidatesClient candidates={data.candidates} recruiterId={recruiterId} org={org} />
}
