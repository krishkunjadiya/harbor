"use client"

import { useParams } from "next/navigation"
import { ProfileSettingsPage } from "@/components/settings/profile-settings-page"
import { studentSections } from "@/components/settings/profile-settings-configs"
import { useStudentProfileSettings } from "@/lib/hooks/useStudentProfileSettings"

export default function UniversityStudentProfileSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  const { formData, loading, saving, isDirty, onChange, onSubmit } = useStudentProfileSettings({
    loginPath: `/${org}/login`,
    activityContext: { portal: "university-student", org } })

  return (
    <ProfileSettingsPage
      pageTitle="Profile Settings"
      pageDescription="Manage your student profile details"
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
