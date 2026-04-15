"use client"

import { ProfileSettingsPage } from "@/components/settings/profile-settings-page"
import { adminSections } from "@/components/settings/profile-settings-configs"
import { useRecruiterAdminProfileSettings } from "@/lib/hooks/useRecruiterAdminProfileSettings"

export default function DashboardProfileSettingsPage() {
  const { formData, loading, saving, isDirty, onChange, onSubmit } = useRecruiterAdminProfileSettings({
    mode: "university-admin",
    loginPath: "/login",
    activityContext: { portal: "dashboard" } })

  return (
    <ProfileSettingsPage
      pageTitle="Profile Settings"
      pageDescription="Manage your account information"
      sections={adminSections}
      formData={formData}
      onChange={onChange}
      onSubmit={onSubmit}
      loading={loading}
      saving={saving}
      isDirty={isDirty}
    />
  )
}
