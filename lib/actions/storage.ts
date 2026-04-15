'use server'

import { createClient } from '@/lib/supabase/server'

// =============================================
// FILE UPLOAD UTILITIES
// =============================================

export type UploadResult = {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: 'avatars' | 'resumes' | 'credentials',
  userId: string
): Promise<UploadResult> {
  const supabase = await createClient()
  
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: 'avatars' | 'resumes' | 'credentials',
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Upload profile picture/avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, 'avatars', userId)
}

/**
 * Upload resume
 */
export async function uploadResume(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, 'resumes', userId)
}

/**
 * Upload credential document
 */
export async function uploadCredentialDocument(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadFile(file, 'credentials', userId)
}

/**
 * Get file URL from storage
 */
export async function getFileUrl(
  bucket: 'avatars' | 'resumes' | 'credentials',
  filePath: string
): Promise<string> {
  const supabase = await createClient()
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}
