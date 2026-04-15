"use client"

import { PasswordSettingsPage } from "@/components/settings/password-settings-page"

export default function StudentSecuritySettingsPage() {
  return (
    <PasswordSettingsPage
      pageTitle="Security Settings"
      cardTitle="Change Password"
      cardDescription="Use a strong password to protect your account."
      loginPath="/login"
      activityContext={{ portal: "student" }}
    />
  )
}
