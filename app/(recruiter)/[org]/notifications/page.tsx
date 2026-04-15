import { NotificationsPageShell } from '@/app/shared/notifications/notifications-page-shell'
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function RecruiterNotificationsPage() {
  const profile = await requireRouteUserType(['recruiter'])

  return <NotificationsPageShell userId={profile.id} />
}

