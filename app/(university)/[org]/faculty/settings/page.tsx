import { redirect } from 'next/navigation'

export default async function UniversityFacultySettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  redirect(`/${org}/faculty/settings/profile`)
}
