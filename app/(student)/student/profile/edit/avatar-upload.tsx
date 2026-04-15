'use client'

import { uploadAvatar } from '@/lib/actions/storage'
import { updateUserProfile } from '@/lib/actions/mutations'
import { FileUpload } from '@/components/file-upload'
import { useRouter } from 'next/navigation'

export function AvatarUpload({ userId }: { userId: string }) {
  const router = useRouter()

  const handleUpload = async (file: File) => {
    // Upload to Supabase Storage
    const uploadResult = await uploadAvatar(file, userId)
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error }
    }

    // Update profile with new avatar URL
    const updateResult = await updateUserProfile(userId, {
      avatar_url: uploadResult.url
    })

    if (updateResult.success) {
      router.refresh()
    }

    return updateResult
  }

  return (
    <FileUpload
      accept="image/*"
      maxSize={5}
      onUpload={handleUpload}
      label="Upload Profile Picture"
      description="PNG, JPG or GIF (max 5MB)"
    />
  )
}
