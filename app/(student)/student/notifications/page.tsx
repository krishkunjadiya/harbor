import { requireRouteUserType } from "@/lib/auth/route-context"
import { NotificationsPageShell } from '@/app/shared/notifications/notifications-page-shell'

export const metadata = {
  title: 'Notifications | Harbor',
  description: 'View your notifications and updates' }

export default async function StudentNotificationsPage() {
  const profile = await requireRouteUserType(['student'])

  return (
    <NotificationsPageShell
      userId={profile.id}
      title="Notifications"
      description="Stay updated with your latest activity"
    />
  )
}

