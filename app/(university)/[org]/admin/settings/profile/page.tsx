"use client"

import { useParams } from "next/navigation"
import { ProfileSettingsPage } from "@/components/settings/profile-settings-page"
import { adminSections } from "@/components/settings/profile-settings-configs"
import { useRecruiterAdminProfileSettings } from "@/lib/hooks/useRecruiterAdminProfileSettings"

export default function UniversityAdminProfileSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  const { formData, loading, saving, isDirty, onChange, onSubmit } = useRecruiterAdminProfileSettings({
    mode: "university-admin",
    loginPath: `/${org}/login`,
    activityContext: { portal: "university-admin", org } })

  return (
    <ProfileSettingsPage
      pageTitle="Profile Settings"
      pageDescription="Manage your university admin profile"
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
