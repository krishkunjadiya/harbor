"use client"

import { useParams, useRouter } from "next/navigation"
import { PreferencesSettingsPage } from "@/components/settings/preferences-settings-page"

const defaultPermissions: Record<string, boolean> = {
  manageJobs: true,
  viewCandidates: true,
  scheduleInterviews: true,
  exportData: false,
  teamManagement: false }

export default function RecruiterPermissionsSettingsPage() {
  const params = useParams()
  const org = params?.org as string
  return (
    <PreferencesSettingsPage
      pageTitle="Permissions Settings"
      cardTitle="Team Permissions"
      cardDescription="Manage recruiter workspace access and candidate data visibility."
      loginPath={`/${org}/login`}
      profileColumn="user_preferences"
      defaultPreferences={defaultPermissions}
      options={[
        { key: "manageJobs", label: "Manage job postings" },
        { key: "viewCandidates", label: "View candidate profiles" },
        { key: "scheduleInterviews", label: "Schedule interviews" },
        { key: "exportData", label: "Export hiring data" },
        { key: "teamManagement", label: "Manage team members" },
      ]}
      errorMessage="Failed to save permissions"
      successMessage="Permissions updated"
      activityType="settings_permissions_updated"
      activityContext={{ portal: "recruiter", org }}
    />
  )
}
