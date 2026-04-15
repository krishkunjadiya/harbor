"use client"

import { useParams } from "next/navigation"
import { PasswordSettingsPage } from "@/components/settings/password-settings-page"

export default function RecruiterSecuritySettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PasswordSettingsPage
      pageTitle="Security Settings"
      cardTitle="Account Password"
      cardDescription="Secure your recruiter account and hiring workflows."
      loginPath={`/${org}/login`}
      activityContext={{ portal: "recruiter", org }}
    />
  )
}
