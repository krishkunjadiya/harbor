'use client'

import { uploadCredentialDocument } from '@/lib/actions/storage'
import { createCredential } from '@/lib/actions/mutations'
import { FileUpload } from '@/components/file-upload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SpinnerGap, WarningCircle, CheckCircle as CheckCircle2 } from '@phosphor-icons/react'

interface CredentialUploadProps {
  userId: string
  onUploadSuccess?: () => void
}

export function CredentialUpload({ userId, onUploadSuccess }: CredentialUploadProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [credentialName, setCredentialName] = useState('')
  const [credentialType, setCredentialType] = useState('certificate')
  const [issuer, setIssuer] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    return Promise.resolve({ success: true })
  }

  const handleSubmit = async () => {
    // Validation
    if (!file) {
      setError('Please upload a file')
      return
    }
    if (!credentialName.trim()) {
      setError('Please enter a credential name')
      return
    }
    if (!issuer.trim()) {
      setError('Please enter the issuing institution/organization')
      return
    }
    if (!issueDate) {
      setError('Please select an issue date')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Upload document
      const uploadResult = await uploadCredentialDocument(file, userId)
      
      if (!uploadResult.success) {
        setError(uploadResult.error || 'Failed to upload document')
        return
      }

      // Create credential record
      const createResult = await createCredential(userId, {
        title: credentialName.trim(),
        institution: issuer.trim(),
        credential_url: uploadResult.url,
        type: credentialType as any,
        issue_date: new Date(issueDate).toISOString(),
        verified: false
      })

      if (createResult.success) {
        setSuccess(true)
        setCredentialName('')
        setCredentialType('certificate')
        setIssuer('')
        setIssueDate('')
        setFile(null)
        
        // Call parent callback if provided
        if (onUploadSuccess) {
          onUploadSuccess()
        } else {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['student', 'dashboard', userId] }),
            queryClient.invalidateQueries({ queryKey: ['student', 'jobs-page-data', userId] }),
            queryClient.invalidateQueries({ queryKey: ['student', 'applications-page-data', userId] }),
          ])
          router.refresh()
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(createResult.error || 'Failed to create credential record')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = credentialName.trim() && issuer.trim() && issueDate && file && !isSubmitting

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/30">
          <WarningCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success border border-success/30">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Credential uploaded successfully!</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="credential-name" className="text-base font-semibold">Credential Name *</Label>
        <Input
          id="credential-name"
          placeholder="e.g., AWS Certified Solutions Architect"
          value={credentialName}
          onChange={(e) => {
            setCredentialName(e.target.value)
            setError(null)
          }}
          disabled={isSubmitting}
          aria-invalid={error ? true : false}
        />
        <p className="text-xs text-muted-foreground">The name or title of your credential</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credential-type" className="text-base font-semibold">Type *</Label>
          <Select value={credentialType} onValueChange={setCredentialType} disabled={isSubmitting}>
            <SelectTrigger id="credential-type" aria-label="Select credential type" aria-invalid={error ? true : false}>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="degree">Degree</SelectItem>
              <SelectItem value="diploma">Diploma</SelectItem>
              <SelectItem value="license">License</SelectItem>
              <SelectItem value="course">Course</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="issue-date" className="text-base font-semibold">Issue Date *</Label>
          <Input
            id="issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => {
              setIssueDate(e.target.value)
              setError(null)
            }}
            disabled={isSubmitting}
            aria-invalid={error ? true : false}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuer" className="text-base font-semibold">Issuing Organization *</Label>
        <Input
          id="issuer"
          placeholder="e.g., Amazon Web Services, Microsoft, Google"
          value={issuer}
          onChange={(e) => {
            setIssuer(e.target.value)
            setError(null)
          }}
          disabled={isSubmitting}          aria-invalid={error ? true : false}        />
        <p className="text-xs text-muted-foreground">The organization that issued this credential</p>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">Document *</Label>
        <FileUpload
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          maxSize={10}
          onUpload={handleFileSelect}
          label="Choose File"
          description="PDF or image file (max 10MB)"
          disabled={isSubmitting}
        />
        {file && (
          <p className="text-xs text-success">✓ File selected: {file.name}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="flex-1 gap-2"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <SpinnerGap className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Credential'
          )}
        </Button>
      </div>
    </div>
  )
}
