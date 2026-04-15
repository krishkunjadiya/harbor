"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPreferences: Record<string, boolean> = {
  emailNotifications: true,
  assignmentUpdates: true,
  gradeUpdates: true,
  messageNotifications: true,
  weeklyDigest: false }

export default function UniversityStudentCommunicationSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Communication Settings"
      cardTitle="Notification Preferences"
      cardDescription="Manage how you receive campus and course updates."
      loginPath={`/${org}/login`}
      profileColumn="notification_preferences"
      defaultPreferences={defaultPreferences}
      options={[
        { key: "emailNotifications", label: "Email Notifications" },
        { key: "assignmentUpdates", label: "Assignment Updates" },
        { key: "gradeUpdates", label: "Grade Updates" },
        { key: "messageNotifications", label: "Message Notifications" },
        { key: "weeklyDigest", label: "Weekly Digest" },
      ]}
      errorMessage="Failed to save communication preferences"
      successMessage="Communication preferences updated"
      activityType="settings_communication_updated"
      activityContext={{ portal: "university-student", org }}
    />
  )
}
