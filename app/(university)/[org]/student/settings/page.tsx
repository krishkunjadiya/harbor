import { redirect } from 'next/navigation'

export default async function UniversityStudentSettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  redirect(`/${org}/student/settings/profile`)
}
