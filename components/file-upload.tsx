'use client'

import { useState, useRef } from 'react'
import { UploadSimple, X as XIcon, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type FileUploadProps = {
  accept?: string
  maxSize?: number // in MB
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>
  label?: string
  description?: string
  disabled?: boolean
}

export function FileUpload({
  accept = '*',
  maxSize = 10,
  onUpload,
  label = 'Upload File',
  description,
  disabled = false
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file size
    const sizeInMB = selectedFile.size / (1024 * 1024)
    if (sizeInMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await onUpload(file)
      
      if (result.success) {
        setSuccess(true)
        setFile(null)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={disabled || uploading}
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            asChild
          >
            <span>
              <UploadSimple className="h-4 w-4 mr-2" />
              {label}
            </span>
          </Button>
        </label>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      {file && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemove}
                  disabled={uploading}
                  aria-label="Remove file"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <WarningCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          <span>File uploaded successfully!</span>
        </div>
      )}
    </div>
  )
}
