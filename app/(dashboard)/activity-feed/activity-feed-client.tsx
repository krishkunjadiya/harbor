'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  CheckCircle, 
  WarningCircle, 
  EnvelopeSimple, 
  FileText,
  TrendUp,
  UserPlus as UserPlusIcon,
  ChatCircle as MessageSquareIcon
} from '@phosphor-icons/react'

interface ActivityFeedClientProps {
  activities: any[]
  userId: string
  org: string
}

export function ActivityFeedClient({ activities: initialActivities, userId, org }: ActivityFeedClientProps) {
  const getActivityStyle = (type: string) => {
    switch(type) {
      case 'application_status': return { icon: CheckCircle, color: 'bg-success/15 text-success' }
      case 'message': return { icon: MessageSquareIcon, color: 'bg-info/15 text-info' }
      case 'grade_posted': return { icon: FileText, color: 'bg-primary/15 text-primary' }
      case 'enrollment': return { icon: UserPlusIcon, color: 'bg-warning/20 text-warning' }
      case 'assignment_due': return { icon: WarningCircle, color: 'bg-warning/20 text-warning' }
      default: return { icon: Bell, color: 'bg-muted text-muted-foreground' }
    }
  }

  const [activities, setActivities] = useState(() => {
    if (initialActivities && initialActivities.length > 0) {
      return initialActivities.map(a => ({
        ...a,
        timestamp: new Date(a.created_at || a.timestamp),
        ...getActivityStyle(a.type)
      }))
    }
    return []
  })
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleMarkAsRead = (activityId: string) => {
    setActivities(activities.map(a =>
      a.id === activityId ? { ...a, read: true } : a
    ))
  }

  const handleMarkAllAsRead = () => {
    setActivities(activities.map(a => ({ ...a, read: true })))
  }

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.description.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'unread') return matchesSearch && !a.read
    if (filter === 'application') return matchesSearch && a.type === 'application_status'
    if (filter === 'academic') return matchesSearch && (a.type === 'grade_posted' || a.type === 'assignment_due')
    return matchesSearch
  })

  const stats = {
    total: activities.length,
    unread: activities.filter(a => !a.read).length
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return timestamp.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Stats and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {stats.total} Activities
            {stats.unread > 0 && (
              <Badge className="ml-2" variant="destructive">{stats.unread} New</Badge>
            )}
          </h3>
        </div>
        {stats.unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({stats.unread})</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activities</h3>
              <p className="text-sm text-muted-foreground">Your activities will appear here</p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => {
            const IconComponent = activity.icon
            return (
              <Card 
                key={activity.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${!activity.read ? 'border-info bg-info/10' : ''}`}
                onClick={() => handleMarkAsRead(activity.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm leading-tight">{activity.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        </div>
                        {!activity.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-info mt-1"></div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Timeline View */}
      {filteredActivities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>
          <div className="space-y-4">
            {Object.entries(
              filteredActivities.reduce((groups: any, activity) => {
                const date = activity.timestamp.toLocaleDateString()
                if (!groups[date]) groups[date] = []
                groups[date].push(activity)
                return groups
              }, {})
            ).map(([date, dayActivities]: any) => (
              <div key={date}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h4>
                <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                  {dayActivities.map((activity: any) => (
                    <div key={activity.id} className="pb-4">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
