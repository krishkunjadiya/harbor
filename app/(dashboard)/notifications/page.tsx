import { NotificationsPageShell } from '@/app/shared/notifications/notifications-page-shell'
import { requireRouteProfile } from "@/lib/auth/route-context"

export default async function DashboardNotificationsPage() {
  const profile = await requireRouteProfile()

  return <NotificationsPageShell userId={profile.id} />
}
