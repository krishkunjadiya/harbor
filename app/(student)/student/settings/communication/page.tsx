"use client"

import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  applicationUpdates: true,
  credentialAlerts: true,
  systemNotifications: true,
  weeklyDigest: false }

export default function StudentCommunicationSettingsPage() {
  return (
    <PreferencesSettingsPage
      pageTitle="Communication Settings"
      pageDescription="Manage notification channels and preference types"
      cardTitle="Notification Preferences"
      cardDescription="Control how and when you receive updates."
      loginPath="/login"
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "applicationUpdates", label: "Application Updates" },
        { key: "credentialAlerts", label: "Credential Alerts" },
        { key: "systemNotifications", label: "In-app System Notifications" },
        { key: "weeklyDigest", label: "Weekly Digest" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "student" }}
    />
  )
}
