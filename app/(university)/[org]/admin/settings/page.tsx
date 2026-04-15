import { redirect } from 'next/navigation'

export default async function UniversityAdminSettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  redirect(`/${org}/admin/settings/profile`)
}