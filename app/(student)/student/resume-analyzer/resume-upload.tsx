'use client'

import { uploadResume } from '@/lib/actions/storage'
import { updateStudentProfile, triggerDocumentParser } from '@/lib/actions/mutations'
import { FileUpload } from '@/components/file-upload'
import { useRouter } from 'next/navigation'

export function ResumeUpload({ userId }: { userId: string }) {
  const router = useRouter()

  const handleUpload = async (file: File) => {
    // Upload to Supabase Storage
    const uploadResult = await uploadResume(file, userId)

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error }
    }

    // Update student profile with new resume URL
    const updateResult = await updateStudentProfile(userId, {
      resume_url: uploadResult.url
    })

    if (updateResult.success) {
      // Trigger the Python document parser worker in the background
      await triggerDocumentParser(userId, uploadResult.url, uploadResult.path)

      router.refresh()
    }

    return updateResult
  }

  return (
    <FileUpload
      accept=".pdf,.doc,.docx"
      maxSize={10}
      onUpload={handleUpload}
      label="Upload Resume"
      description="PDF or Word document (max 10MB)"
    />
  )
}
