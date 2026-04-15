"use client"

import { useParams } from "next/navigation"
import { PasswordSettingsPage } from "@/components/settings/password-settings-page"

export default function UniversityStudentSecuritySettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PasswordSettingsPage
      pageTitle="Security Settings"
      cardTitle="Change Password"
      cardDescription="Update your password and keep your student account secure."
      loginPath={`/${org}/login`}
      activityContext={{ portal: "university-student", org }}
    />
  )
}
