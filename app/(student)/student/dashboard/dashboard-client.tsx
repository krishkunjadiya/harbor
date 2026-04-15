'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Briefcase, Medal } from '@phosphor-icons/react'

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Continue where you left off</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full justify-start" variant="outline" asChild>
          <Link href="/student/profile" prefetch={false}>
            <FileText className="h-4 w-4 mr-2" />
            View My Credentials
          </Link>
        </Button>
        <Button className="w-full justify-start" variant="outline" asChild>
          <Link href="/student/resume-builder" prefetch={false}>
            <FileText className="h-4 w-4 mr-2" />
            Open Resume Builder
          </Link>
        </Button>
        <Button className="w-full justify-start" variant="outline" asChild>
          <Link href="/student/jobs" prefetch={false}>
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Job Openings
          </Link>
        </Button>
        <Button className="w-full justify-start" variant="outline" asChild>
          <Link href="/student/profile/edit" prefetch={false}>
            <Medal className="h-4 w-4 mr-2" />
            Update Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function AddCredentialButton() {
  return (
    <Button className="mt-4" size="sm" asChild>
      <Link href="/student/profile" prefetch={false}>Add Credential</Link>
    </Button>
  )
}

export function ResumeBuilderButton() {
  return (
    <Button asChild>
      <Link href="/student/resume-builder" prefetch={false}>
        <FileText className="h-4 w-4 mr-2" />
        Open Resume Builder
      </Link>
    </Button>
  )
}
