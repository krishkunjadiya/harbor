import { requireRouteProfile } from "@/lib/auth/route-context"
import { NotificationsPageShell } from './notifications-page-shell'

export default async function NotificationsPage() {
  const profile = await requireRouteProfile()

  return <NotificationsPageShell userId={profile.id} />
}
