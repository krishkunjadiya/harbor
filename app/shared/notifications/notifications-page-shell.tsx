import { NotificationsClient } from './notifications-client'

type NotificationsPageShellProps = {
  userId: string
  title?: string
  description?: string
}

export function NotificationsPageShell({ userId, title, description }: NotificationsPageShellProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="space-y-1">
          {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      <NotificationsClient userId={userId} />
    </div>
  )
}
