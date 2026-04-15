"use client"

import { useParams } from "next/navigation"
import { ProfileSettingsPage } from "@/components/settings/profile-settings-page"
import { recruiterSections } from "@/components/settings/profile-settings-configs"
import { useRecruiterAdminProfileSettings } from "@/lib/hooks/useRecruiterAdminProfileSettings"

export default function RecruiterProfileSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  const { formData, loading, saving, isDirty, onChange, onSubmit } = useRecruiterAdminProfileSettings({
    mode: "recruiter",
    loginPath: `/${org}/login`,
    activityContext: { portal: "recruiter", org } })

  return (
    <ProfileSettingsPage
      pageTitle="Profile Settings"
      pageDescription="Manage your recruiter and company profile details"
      sections={recruiterSections}
      formData={formData}
      onChange={onChange}
      onSubmit={onSubmit}
      loading={loading}
      saving={saving}
      isDirty={isDirty}
    />
  )
}
