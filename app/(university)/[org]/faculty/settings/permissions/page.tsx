"use client"

import { useParams } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  viewStudentInfo: true,
  gradeAssignments: true,
  createAssignments: true,
  sendMessages: true,
  accessAnalytics: true,
  downloadGrades: true,
  shareResources: true }

export default function FacultyPermissionsSettingsPage() {
  const params = useParams()
  const org = params?.org as string

  return (
    <PreferencesSettingsPage
      pageTitle="Permissions & Privacy"
      pageDescription="Control how students interact with your profile and course resources"
      cardTitle="Faculty Permissions"
      cardDescription="These settings apply to student visibility and interaction permissions."
      loginPath={`/${org}/login`}
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "viewStudentInfo", label: "Allow students to view faculty profile details" },
        { key: "accessAnalytics", label: "Allow students to view course analytics" },
        { key: "downloadGrades", label: "Allow grade export for students" },
        { key: "sendMessages", label: "Allow student messages" },
        { key: "shareResources", label: "Allow resource sharing" },
        { key: "createAssignments", label: "Faculty assignment management access" },
        { key: "gradeAssignments", label: "Faculty grading access" },
      ]}
      errorMessage="Failed to save permissions"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "university-faculty", org }}
    />
  )
}
