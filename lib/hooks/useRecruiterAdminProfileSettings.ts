"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { isValidOptionalPhone, isValidOptionalUrl, logSettingsActivity } from "@/lib/utils/settingsHelpers"

type RecruiterAdminMode = "recruiter" | "university-admin"

type UseRecruiterAdminProfileSettingsOptions = {
  mode: RecruiterAdminMode
  loginPath: string
  activityContext: Record<string, unknown>
}

type RecruiterFormData = {
  full_name: string
  phone: string
  company: string
  job_title: string
  company_size: string
  industry: string
  company_website: string
  location: string
}

type AdminFormData = {
  full_name: string
  phone: string
}

const DEFAULT_RECRUITER_FORM: RecruiterFormData = {
  full_name: "",
  phone: "",
  company: "",
  job_title: "",
  company_size: "",
  industry: "",
  company_website: "",
  location: "",
}

const DEFAULT_ADMIN_FORM: AdminFormData = {
  full_name: "",
  phone: "",
}

export function useRecruiterAdminProfileSettings({
  mode,
  loginPath,
  activityContext,
}: UseRecruiterAdminProfileSettingsOptions) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>(
    mode === "recruiter" ? DEFAULT_RECRUITER_FORM : DEFAULT_ADMIN_FORM,
  )
  const [initialFormData, setInitialFormData] = useState<Record<string, string>>(
    mode === "recruiter" ? DEFAULT_RECRUITER_FORM : DEFAULT_ADMIN_FORM,
  )

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

      const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()

      if (mode === "recruiter") {
        const { data: recruiter } = await supabase
          .from("recruiters")
          .select("company, job_title, company_size, industry, company_website, location")
          .eq("profile_id", user.id)
          .single()

        const nextFormData: Record<string, string> = {
          full_name: profile?.full_name || "",
          phone: profile?.phone || "",
          company: recruiter?.company || "",
          job_title: recruiter?.job_title || "",
          company_size: recruiter?.company_size || "",
          industry: recruiter?.industry || "",
          company_website: recruiter?.company_website || "",
          location: recruiter?.location || "",
        }

        setFormData(nextFormData)
        setInitialFormData(nextFormData)
        setLoading(false)
        return
      }

      const nextFormData: Record<string, string> = {
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
      }

      setFormData(nextFormData)
      setInitialFormData(nextFormData)
      setLoading(false)
    }

    loadData()
  }, [loginPath, mode, router])

  const onChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!isValidOptionalPhone(formData.phone || "")) {
      toast.error("Please enter a valid phone number")
      return
    }

    if (mode === "recruiter" && !isValidOptionalUrl(formData.company_website || "")) {
      toast.error("Please enter a valid company website URL")
      return
    }

    setSaving(true)
    const supabase = createClient()

    const profileUpdates = {
      full_name: formData.full_name || null,
      phone: formData.phone || null,
    }

    const { error: profileError } = await supabase.from("profiles").update(profileUpdates).eq("id", userId)

    let recruiterError: { message?: string } | null = null
    if (mode === "recruiter") {
      const recruiterUpdates = {
        company: formData.company || null,
        job_title: formData.job_title || null,
        company_size: formData.company_size || null,
        industry: formData.industry || null,
        company_website: formData.company_website || null,
        location: formData.location || null,
      }

      const { error } = await supabase.from("recruiters").update(recruiterUpdates).eq("profile_id", userId)
      recruiterError = error
    }

    setSaving(false)

    if (profileError || recruiterError) {
      toast.error(mode === "recruiter" ? "Failed to update recruiter profile" : "Failed to update profile settings")
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
