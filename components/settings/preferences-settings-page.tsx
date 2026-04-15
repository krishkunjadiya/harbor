"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { logSettingsActivity } from "@/lib/utils/settingsHelpers"

type PreferenceOption = {
  key: string
  label: string
}

type PreferencesSettingsPageProps = {
  pageTitle: string
  pageDescription?: string
  cardTitle: string
  cardDescription: string
  loginPath: string
  profileColumn: "notification_preferences" | "user_preferences"
  defaultPreferences: Record<string, boolean>
  options: PreferenceOption[]
  errorMessage: string
  successMessage: string
  activityType: "settings_communication_updated" | "settings_permissions_updated"
  activityContext?: Record<string, unknown>
}

export function PreferencesSettingsPage({
  pageTitle,
  pageDescription,
  cardTitle,
  cardDescription,
  loginPath,
  profileColumn,
  defaultPreferences,
  options,
  errorMessage,
  successMessage,
  activityType,
  activityContext = {} }: PreferencesSettingsPageProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultPreferences)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(loginPath)
        return
      }

      setUserId(user.id)

      const { data } = await supabase.from("profiles").select(profileColumn).eq("id", user.id).single()
      const profile = data as Record<string, unknown> | null
      const storedPreferences = profile?.[profileColumn] as Record<string, boolean> | undefined

      if (storedPreferences) {
        setPreferences({ ...defaultPreferences, ...storedPreferences })
      }
    }

    loadData()
  }, [defaultPreferences, loginPath, profileColumn, router])

  const togglePreference = async (key: string) => {
    if (!userId) return

    const previous = preferences
    const updated = {
      ...preferences,
      [key]: !preferences[key] }
    setPreferences(updated)

    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ [profileColumn]: updated }).eq("id", userId)

    if (error) {
      toast.error(errorMessage)
      setPreferences(previous)
      return
    }

    await logSettingsActivity(supabase, userId, activityType, {
      ...activityContext,
      key,
      value: updated[key] })

    toast.success(successMessage)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        {pageDescription ? <p className="text-muted-foreground">{pageDescription}</p> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.map((option) => (
            <div key={option.key} className="flex items-center justify-between border-b pb-3 last:border-b-0">
              <Label htmlFor={option.key} className="text-sm font-medium">
                {option.label}
              </Label>
              <Switch
                id={option.key}
                checked={Boolean(preferences[option.key])}
                onCheckedChange={() => togglePreference(option.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
