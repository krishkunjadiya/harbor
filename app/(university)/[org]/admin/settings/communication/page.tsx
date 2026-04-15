"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  systemAlerts: true,
  departmentUpdates: true,
  approvalReminders: true,
  weeklyDigest: true }

export default function UniversityAdminCommunicationSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Communication Settings"
      cardTitle="Admin Notification Preferences"
      cardDescription="Set official communication channels for institutional notifications."
      loginPath={`/${org}/login`}
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "systemAlerts", label: "System Alerts" },
        { key: "departmentUpdates", label: "Department Updates" },
        { key: "approvalReminders", label: "Approval Reminders" },
        { key: "weeklyDigest", label: "Weekly Digest" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "university-admin", org }}
    />
  )
}
