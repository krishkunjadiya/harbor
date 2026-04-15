"use client"

import { ProfileSettingsPage } from "@/components/settings/profile-settings-page"
import { studentSections } from "@/components/settings/profile-settings-configs"
import { useStudentProfileSettings } from "@/lib/hooks/useStudentProfileSettings"

export default function StudentProfileSettingsPage() {
  const { formData, loading, saving, isDirty, onChange, onSubmit } = useStudentProfileSettings({
    loginPath: "/login",
    activityContext: { portal: "student" } })

  return (
    <ProfileSettingsPage
      pageTitle="Profile Settings"
      pageDescription="Manage your personal information and profile links"
      sections={studentSections}
      formData={formData}
      onChange={onChange}
      onSubmit={onSubmit}
      loading={loading}
      saving={saving}
      isDirty={isDirty}
    />
  )
}
