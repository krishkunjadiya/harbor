"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { isValidOptionalGpa, isValidOptionalPhone, isValidOptionalUrl, logSettingsActivity } from "@/lib/utils/settingsHelpers"

type StudentProfileFormData = {
  full_name: string
  phone: string
  bio: string
  university: string
  major: string
  graduation_year: string
  gpa: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
}

type UseStudentProfileSettingsOptions = {
  loginPath: string
  activityContext: Record<string, unknown>
}

const DEFAULT_FORM_DATA: StudentProfileFormData = {
  full_name: "",
  phone: "",
  bio: "",
  university: "",
  major: "",
  graduation_year: "",
  gpa: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
}

export function useStudentProfileSettings({ loginPath, activityContext }: UseStudentProfileSettingsOptions) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<StudentProfileFormData>(DEFAULT_FORM_DATA)
  const [initialFormData, setInitialFormData] = useState<StudentProfileFormData>(DEFAULT_FORM_DATA)

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(loginPath)
        return
      }

      setUserId(user.id)

      const [{ data: profile }, { data: student }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
        supabase
          .from("students")
          .select("bio, university, major, graduation_year, gpa, linkedin_url, github_url, portfolio_url")
          .eq("profile_id", user.id)
          .single(),
      ])

      const nextFormData: StudentProfileFormData = {
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        bio: student?.bio || "",
        university: student?.university || "",
        major: student?.major || "",
        graduation_year: student?.graduation_year || "",
        gpa: student?.gpa ? String(student.gpa) : "",
        linkedin_url: student?.linkedin_url || "",
        github_url: student?.github_url || "",
        portfolio_url: student?.portfolio_url || "",
      }

      setFormData(nextFormData)
      setInitialFormData(nextFormData)
      setLoading(false)
    }

    loadData()
  }, [loginPath, router])

  const onChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!isValidOptionalPhone(formData.phone)) {
      toast.error("Please enter a valid phone number")
      return
    }

    if (!isValidOptionalGpa(formData.gpa)) {
      toast.error("GPA must be between 0 and 4")
      return
    }

    if (!isValidOptionalUrl(formData.linkedin_url) || !isValidOptionalUrl(formData.github_url) || !isValidOptionalUrl(formData.portfolio_url)) {
      toast.error("Please enter valid profile URLs")
      return
    }

    setSaving(true)
    const supabase = createClient()

    const profileUpdates = {
      full_name: formData.full_name || null,
      phone: formData.phone || null,
    }

    const studentUpdates = {
      bio: formData.bio || null,
      university: formData.university || null,
      major: formData.major || null,
      graduation_year: formData.graduation_year || null,
      gpa: formData.gpa ? Number(formData.gpa) : null,
      linkedin_url: formData.linkedin_url || null,
      github_url: formData.github_url || null,
      portfolio_url: formData.portfolio_url || null,
    }

    const [{ error: profileError }, { error: studentError }] = await Promise.all([
      supabase.from("profiles").update(profileUpdates).eq("id", userId),
      supabase.from("students").update(studentUpdates).eq("profile_id", userId),
    ])

    setSaving(false)

    if (profileError || studentError) {
      toast.error("Failed to update profile settings")
      return
    }

    await logSettingsActivity(supabase, userId, "settings_profile_updated", activityContext)
    setInitialFormData(formData)
    toast.success("Profile settings updated")
  }

  return {
    formData,
    loading,
    saving,
    isDirty,
    onChange,
    onSubmit,
  }
}
