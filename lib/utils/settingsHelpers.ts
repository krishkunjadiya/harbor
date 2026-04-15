import type { SupabaseClient } from "@supabase/supabase-js"

export function isValidOptionalUrl(value: string): boolean {
  const normalized = value.trim()
  if (!normalized) {
    return true
  }

  try {
    const withProtocol = normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`
    new URL(withProtocol)
    return true
  } catch {
    return false
  }
}

export function isValidOptionalPhone(value: string): boolean {
  const normalized = value.trim()
  if (!normalized) {
    return true
  }

  return /^[+]?[0-9()\-\s]{7,20}$/.test(normalized)
}

export function isValidOptionalGpa(value: string): boolean {
  const normalized = value.trim()
  if (!normalized) {
    return true
  }

  const numeric = Number(normalized)
  return !Number.isNaN(numeric) && numeric >= 0 && numeric <= 4
}

export function isStrongPassword(value: string): boolean {
  if (value.length < 8) {
    return false
  }

  const hasUpper = /[A-Z]/.test(value)
  const hasLower = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)

  return hasUpper && hasLower && hasNumber
}

export async function logSettingsActivity(
  supabase: SupabaseClient,
  userId: string,
  activityType: string,
  activityData?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      activity_data: activityData || {},
    })
  } catch {
    // Non-blocking logging for settings pages.
  }
}
