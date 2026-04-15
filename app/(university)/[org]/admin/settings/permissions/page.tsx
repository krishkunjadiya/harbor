"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  manageFaculty: true,
  manageStudents: true,
  manageDepartments: true,
  manageSettings: true,
  manageMembers: false }

export default function UniversityAdminPermissionsSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Permissions Settings"
      cardTitle="Administrative Access"
      cardDescription="Configure what institutional actions this admin account can perform."
      loginPath={`/${org}/login`}
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "manageFaculty", label: "Manage faculty records" },
        { key: "manageStudents", label: "Manage student records" },
        { key: "manageDepartments", label: "Manage departments" },
        { key: "manageSettings", label: "Manage university settings" },
        { key: "manageMembers", label: "Manage members and roles" },
      ]}
      errorMessage="Failed to save permissions"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "university-admin", org }}
    />
  )
}
