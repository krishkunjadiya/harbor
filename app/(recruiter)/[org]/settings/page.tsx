import { redirect } from 'next/navigation'

export default async function RecruiterSettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  redirect(`/${org}/settings/profile`)
}
