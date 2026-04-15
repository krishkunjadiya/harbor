"use client"

import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  profileVisible: true,
  showEmail: false,
  showPhone: false,
  allowDataExport: true }

export default function PermissionsSettingsPage() {
  return (
    <PreferencesSettingsPage
      pageTitle="Permissions Settings"
      pageDescription="Control profile visibility and privacy defaults"
      cardTitle="Privacy Controls"
      cardDescription="Choose how your account data is shared in the platform."
      loginPath="/login"
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "profileVisible", label: "Make my profile visible" },
        { key: "showEmail", label: "Show email address" },
        { key: "showPhone", label: "Show phone number" },
        { key: "allowDataExport", label: "Allow profile data export" },
      ]}
      errorMessage="Failed to save permissions"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "dashboard" }}
    />
  )
}
