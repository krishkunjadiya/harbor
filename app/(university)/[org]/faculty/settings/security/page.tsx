"use client"

import { useParams } from "next/navigation"
import { PasswordSettingsPage } from "@/components/settings/password-settings-page"

export default function FacultySecuritySettingsPage() {
  const params = useParams()
  const org = params?.org as string

  return (
    <PasswordSettingsPage
      pageTitle="Security Settings"
      cardTitle="Change Password"
      cardDescription="Use a strong password to secure your faculty account."
      loginPath={`/${org}/login`}
      activityContext={{ portal: "university-faculty", org }}
    />
  )
}
