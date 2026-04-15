'use client'

import { useRealtimeNotifications, useNotificationPermission } from '@/lib/hooks/useRealtime'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/mutations'
import { Bell, Check as CheckIcon, X as XIcon } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type NotificationsClientProps = {
  userId: string
}

export function NotificationsClient({ userId }: NotificationsClientProps) {
  const { notifications, unreadCount } = useRealtimeNotifications(userId)
  const { permission, requestPermission } = useNotificationPermission()
  const router = useRouter()

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    // The realtime subscription will automatically update the UI
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId)
    router.refresh()
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application_update':
        return 'bg-info/10 text-info border-info/30'
      case 'application_received':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'credential_verified':
        return 'bg-warning/15 text-warning border-warning/35'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckIcon className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${
                !notification.read ? 'border-l-4 border-l-primary' : ''
              } ${getNotificationColor(notification.type)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.action_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(notification.action_url)}
                      >
                        View
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
