"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SpinnerGap } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning"
import { isStrongPassword, logSettingsActivity } from "@/lib/utils/settingsHelpers"

type PasswordSettingsPageProps = {
  pageTitle: string
  cardTitle: string
  cardDescription: string
  loginPath: string
  successMessage?: string
  activityContext?: Record<string, unknown>
}

export function PasswordSettingsPage({
  pageTitle,
  cardTitle,
  cardDescription,
  loginPath,
  successMessage = "Password updated",
  activityContext = {} }: PasswordSettingsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const isDirty = newPassword.length > 0 || confirmPassword.length > 0
  useUnsavedChangesWarning(isDirty && !loading)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error("Please complete all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!isStrongPassword(newPassword)) {
      toast.error("Password must be 8+ chars with uppercase, lowercase, and number")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const {
      data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      router.push(loginPath)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await logSettingsActivity(supabase, user.id, "settings_security_updated", activityContext)

    setNewPassword("")
    setConfirmPassword("")
    toast.success(successMessage)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <SpinnerGap className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
