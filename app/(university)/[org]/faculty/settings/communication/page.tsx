"use client"

import { useParams } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  assignmentNotifications: true,
  studentMessages: true,
  gradeUpdates: true,
  courseUpdates: true,
  systemNotifications: true,
  weeklyDigest: true,
  newsAndUpdates: false }

export default function FacultyCommunicationSettingsPage() {
  const params = useParams()
  const org = params?.org as string

  return (
    <PreferencesSettingsPage
      pageTitle="Communication Preferences"
      pageDescription="Manage how you receive faculty notifications and updates"
      cardTitle="Notification Preferences"
      cardDescription="Choose the channels and types of alerts you want to receive."
      loginPath={`/${org}/login`}
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "assignmentNotifications", label: "Assignment & Submission Alerts" },
        { key: "studentMessages", label: "Student Messages" },
        { key: "gradeUpdates", label: "Grade Updates" },
        { key: "courseUpdates", label: "Course Updates" },
        { key: "systemNotifications", label: "In-app System Notifications" },
        { key: "weeklyDigest", label: "Weekly Digest" },
        { key: "newsAndUpdates", label: "News & Platform Updates" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "university-faculty", org }}
    />
  )
}
