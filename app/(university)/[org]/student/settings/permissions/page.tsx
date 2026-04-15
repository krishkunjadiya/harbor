"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  showEmailToFaculty: true,
  showPhoneToFaculty: false,
  showProjects: true,
  allowRecruiterAccess: false }

export default function UniversityStudentPermissionsSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Permissions Settings"
      cardTitle="Privacy Controls"
      cardDescription="Control who can see your profile and activity within your university."
      loginPath={`/${org}/login`}
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "showEmailToFaculty", label: "Allow faculty to view my email" },
        { key: "showPhoneToFaculty", label: "Allow faculty to view my phone" },
        { key: "showProjects", label: "Show projects on my profile" },
        { key: "allowRecruiterAccess", label: "Allow recruiter access to profile" },
      ]}
      errorMessage="Failed to save permissions"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "university-student", org }}
    />
  )
}
