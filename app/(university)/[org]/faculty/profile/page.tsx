'use client'

import { useState, useEffect } from 'react'
import { getFacultyProfile } from '@/lib/actions/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EnvelopeSimple as Mail, Phone, MapPin, Users, BookOpen, Medal as Award } from "@phosphor-icons/react/dist/ssr"
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function FacultyProfilePage() {
  const params = useParams()
  const router = useRouter()
  const org = params?.org as string
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        setLoading(false)
        router.push(`/${org}/login`)
        return
      }

      setUser(currentUser)

      try {
        const facultyProfile = await getFacultyProfile(currentUser.id)
        setProfile(facultyProfile)
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [org, router])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-60" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is not logged in
  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-destructive">Authentication Required</p>
              <p className="text-muted-foreground">
                You must be logged in to view your faculty profile.
              </p>
              <p className="text-sm text-muted-foreground">
                Please <Link href={`/${org}/login`} className="text-info hover:underline">sign in</Link> to continue.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header Section */}
      <div className="space-y-2 mb-6">
        <DashboardHeader title={<>{profile?.name || 'Faculty Profile'}</>} icon={FacultyIcon} />
        <p className="text-muted-foreground">View your faculty profile information</p>
      </div>

      {profile ? (
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{profile.name}</CardTitle>
                  <CardDescription className="text-base mt-1">{profile.position}</CardDescription>
                </div>
                <Link href={`/${org}/faculty/settings/profile`}>
                  <Button size="sm">Edit Profile</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-2">
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a href={`mailto:${profile.email}`} className="text-info hover:underline">
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.office_location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span>{profile.office_location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">Professional Information</h3>
                <div className="grid gap-4">
                  {profile.specialization && (
                    <div>
                      <p className="text-sm text-muted-foreground">Specialization</p>
                      <p className="font-medium">{profile.specialization}</p>
                    </div>
                  )}
                  {profile.office_hours && (
                    <div>
                      <p className="text-sm text-muted-foreground">Office Hours</p>
                      <p className="font-medium">{profile.office_hours}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Biography */}
              {profile.bio && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold">About</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              {/* Stats Row */}
              {(profile.total_courses !== undefined || profile.total_students !== undefined) && (
                <div className="border-t pt-4 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Courses</p>
                    </div>
                    <p className="text-2xl font-bold">{profile.total_courses || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Students</p>
                    </div>
                    <p className="text-2xl font-bold">{profile.total_students || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Status</p>
                    </div>
                    <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                      {profile.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href={`/${org}/faculty/courses`}>
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <BookOpen className="h-6 w-6 text-info" />
                    <p className="font-semibold text-sm">My Courses</p>
                    <p className="text-xs text-muted-foreground">View and manage courses</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${org}/faculty/assignments`}>
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Award className="h-6 w-6 text-success" />
                    <p className="font-semibold text-sm">Assignments</p>
                    <p className="text-xs text-muted-foreground">View assignments</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${org}/faculty/enrollments`}>
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Users className="h-6 w-6 text-primary" />
                    <p className="font-semibold text-sm">Enrollments</p>
                    <p className="text-xs text-muted-foreground">View student enrollments</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${org}/faculty/settings/profile`}>
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Mail className="h-6 w-6 text-warning" />
                    <p className="font-semibold text-sm">Settings</p>
                    <p className="text-xs text-muted-foreground">Edit your profile</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No faculty profile found. Please contact administration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

