'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, ChatCircle as MessageSquareIcon, Bell, Calendar } from '@phosphor-icons/react'

interface TeamCollaborationClientProps {
  org: string
  teamMembers: any[]
  recentActivity: any[]
}

export function TeamCollaborationClient({ org, teamMembers, recentActivity }: TeamCollaborationClientProps) {
  const onlineCount = teamMembers.filter(m => m.status === 'online').length
  const hasPresenceSignal = teamMembers.some(m => m.status === 'online' || m.status === 'offline')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Bell className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {hasPresenceSignal ? onlineCount : '-'}
            </div>
            {!hasPresenceSignal ? (
              <p className="text-xs text-muted-foreground mt-1">Presence signal unavailable</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Active recruitment team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other team members found.</p>
            ) : (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                    {member.status === 'unknown' ? 'status unavailable' : member.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Team activity updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="pb-3 border-b last:border-0">
                  <p className="text-sm"><span className="font-medium">{activity.user}</span> {activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Chat</CardTitle>
          <CardDescription>Messaging integration is not enabled in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-40 border rounded-lg p-4 overflow-y-auto bg-muted/10 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquareIcon className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Team chat is unavailable.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
