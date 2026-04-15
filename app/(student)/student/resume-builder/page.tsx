import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentResumeBuilderLaunchPage() {
  redirect('/api/resume/launch?returnPath=/dashboard')
}
