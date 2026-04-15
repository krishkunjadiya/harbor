"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  candidateAlerts: true,
  applicationStatusUpdates: true,
  interviewReminders: true,
  productAnnouncements: false }

export default function RecruiterCommunicationSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Communication Settings"
      cardTitle="Notification Channels"
      cardDescription="Choose how your hiring team notifications are delivered."
      loginPath={`/${org}/login`}
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "candidateAlerts", label: "New Candidate Alerts" },
        { key: "applicationStatusUpdates", label: "Application Status Updates" },
        { key: "interviewReminders", label: "Interview Reminders" },
        { key: "productAnnouncements", label: "Product Announcements" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "recruiter", org }}
    />
  )
}
