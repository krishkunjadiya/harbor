'use client'

import { useState, useEffect } from 'react'
import { getFacultyProfile, updateFacultyProfile } from '@/lib/actions/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SpinnerGap, CheckCircle as CheckCircle2, WarningCircle } from "@phosphor-icons/react/dist/ssr"
import { useParams, useRouter } from 'next/navigation'
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function FacultyProfileSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const org = params?.org as string
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    specialization: '',
    office_location: '',
    office_hours: '',
    bio: '' })

  // Load faculty profile data
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        setIsLoading(false)
        router.push(`/${org}/login`)
        return
      }

      setUser(currentUser)

      try {
        setError(null)
        const profile = await getFacultyProfile(currentUser.id)
        
        if (profile) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            position: profile.position || '',
            specialization: profile.specialization || '',
            office_location: profile.office_location || '',
            office_hours: profile.office_hours || '',
            bio: profile.bio || '' })
        }
      } catch (err) {
        setError('Failed to load profile')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [org, router])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const result = await updateFacultyProfile(user.id, formData)
      
      if (result) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred while updating your profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-center py-8">
          <SpinnerGap className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-destructive">Authentication Required</p>
              <p className="text-muted-foreground">
                Please log in to access your profile settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="space-y-2">
        <DashboardHeader title="Profile Settings" icon={FacultyIcon} />
        <p className="text-muted-foreground">Manage your faculty profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success border border-success/30">
            <CheckCircle2 className="h-5 w-5" />
            <span>Profile updated successfully</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/30">
            <WarningCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic faculty profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Your academic position and expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Professor, Assistant Professor, Lecturer, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization / Area of Expertise</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Machine Learning, Database Systems"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Office Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Office Information</CardTitle>
            <CardDescription>Your office location and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="office_location">Office Location</Label>
              <Input
                id="office_location"
                name="office_location"
                value={formData.office_location}
                onChange={handleChange}
                placeholder="e.g., Building A, Room 301"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_hours">Office Hours</Label>
              <Input
                id="office_hours"
                name="office_hours"
                value={formData.office_hours}
                onChange={handleChange}
                placeholder="e.g., Monday-Wednesday 2-4 PM, or By appointment"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        <Card>
          <CardHeader>
            <CardTitle>Biography / About</CardTitle>
            <CardDescription>A brief description about you and your teaching philosophy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Write a brief biography about yourself, your research interests, and teaching philosophy..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="bg-info/10 border-info/30">
        <CardContent className="pt-6">
          <p className="text-sm text-info">
            Your profile information is visible to students and colleagues. Please ensure all information is accurate and current.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

