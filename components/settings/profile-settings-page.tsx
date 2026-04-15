"use client"

import { SpinnerGap } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning"

type ProfileField = {
  key: string
  label: string
  type?: "text" | "textarea"
  rows?: number
}

type ProfileSection = {
  title: string
  description: string
  columns?: 1 | 2
  fields: ProfileField[]
}

type ProfileSettingsPageProps = {
  pageTitle: string
  pageDescription: string
  sections: ProfileSection[]
  formData: Record<string, string>
  onChange: (key: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  saving: boolean
  isDirty: boolean
  saveLabel?: string
}

export function ProfileSettingsPage({
  pageTitle,
  pageDescription,
  sections,
  formData,
  onChange,
  onSubmit,
  loading,
  saving,
  isDirty,
  saveLabel = "Save Changes" }: ProfileSettingsPageProps) {
  useUnsavedChangesWarning(isDirty && !saving)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinnerGap className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className={section.columns === 2 ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {section.fields.map((field) => {
                const value = formData[field.key] ?? ""

                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={value}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        rows={field.rows ?? 4}
                      />
                    ) : (
                      <Input id={field.key} value={value} onChange={(e) => onChange(field.key, e.target.value)} />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? <SpinnerGap className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saveLabel}
        </Button>
      </form>
    </div>
  )
}

export type { ProfileField, ProfileSection }
