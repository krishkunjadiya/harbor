"use client"

import { useParams } from "next/navigation"
import { PasswordSettingsPage } from "@/components/settings/password-settings-page"

export default function UniversityAdminSecuritySettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PasswordSettingsPage
      pageTitle="Security Settings"
      cardTitle="Administrator Password"
      cardDescription="Protect your university admin account with strong credentials."
      loginPath={`/${org}/login`}
      activityContext={{ portal: "university-admin", org }}
    />
  )
}
