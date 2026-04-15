'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'

import { FacultyManagementClient } from './faculty-management-client'

type AdminFacultyPayload = {
  faculty: any[]
}

async function fetchAdminFaculty(): Promise<AdminFacultyPayload> {
  const response = await fetch('/api/university/admin-faculty', {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to load faculty')
  }

  return response.json()
}

export function FacultyDataClient({ orgId, universityId }: { orgId: string; universityId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['university', 'admin-faculty', universityId],
    queryFn: fetchAdminFaculty,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (isPending) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">Loading faculty members...</CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">Failed to load faculty members.</CardContent>
      </Card>
    )
  }

  return <FacultyManagementClient facultyAndStaff={data.faculty || []} orgId={orgId} />
}
