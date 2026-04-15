"use client"

import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  accountAlerts: true,
  systemNotifications: true,
  weeklyDigest: false }

export default function CommunicationSettingsPage() {
  return (
    <PreferencesSettingsPage
      pageTitle="Communication Settings"
      pageDescription="Manage how and when you receive dashboard notifications"
      cardTitle="Notification Preferences"
      cardDescription="These settings are saved to your account profile."
      loginPath="/login"
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "accountAlerts", label: "Account Alerts" },
        { key: "systemNotifications", label: "System Notifications" },
        { key: "weeklyDigest", label: "Weekly Digest" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "dashboard" }}
    />
  )
}
