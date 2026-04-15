"use client"

import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  profileVisibleToRecruiters: true,
  profileVisibleToFaculty: true,
  showEmail: false,
  showPhone: false,
  showProjects: true }

export default function StudentPermissionsSettingsPage() {
  return (
    <PreferencesSettingsPage
      pageTitle="Permissions Settings"
      pageDescription="Manage who can access your profile and personal details"
      cardTitle="Privacy Controls"
      cardDescription="These settings apply across student-facing areas."
      loginPath="/login"
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "profileVisibleToRecruiters", label: "Allow recruiters to view my profile" },
        { key: "profileVisibleToFaculty", label: "Allow faculty to view my profile" },
        { key: "showEmail", label: "Show my email in profile" },
        { key: "showPhone", label: "Show my phone number in profile" },
        { key: "showProjects", label: "Show projects and achievements" },
      ]}
      errorMessage="Failed to save privacy settings"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "student" }}
    />
  )
}
