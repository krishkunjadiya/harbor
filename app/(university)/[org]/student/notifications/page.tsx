import { NotificationsPageShell } from '@/app/shared/notifications/notifications-page-shell'
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function UniversityStudentNotificationsPage() {
  const profile = await requireRouteUserType(['university'])

  return <NotificationsPageShell userId={profile.id} />
}

