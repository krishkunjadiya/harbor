'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldCheck as ShieldCheckIcon, FileText, DownloadSimple, ArrowSquareOut, Plus as PlusIcon, MagnifyingGlass, Clock, SpinnerGap, Trash, ShareNetwork as Share2, WarningCircle, Check } from "@phosphor-icons/react"
import { CredentialUpload } from "@/components/credential-upload"
import { formatDate } from "@/lib/utils"
import { deleteCredential, downloadCredential } from "@/lib/actions/mutations"
import { getUserCredentials } from "@/lib/actions/database"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"

interface Credential {
  id: string
  title: string
  institution: string
  type: string
  issue_date: string
  verified: boolean
  credential_url?: string
  created_at?: string
  user_id?: string
}

interface CredentialsClientProps {
  initialCredentials: Credential[]
  userId: string
}

export function CredentialsClient({ initialCredentials, userId }: CredentialsClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Refresh credentials from database
  const refreshCredentials = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const updatedCredentials = await getUserCredentials(userId)
      setCredentials(updatedCredentials || [])
      setSuccessMessage('Credential uploaded successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to refresh credentials')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Handle credential deletion
  const handleDelete = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return

    try {
      setDeletingId(credentialId)
      setError(null)
      const result = await deleteCredential(credentialId)
      
      if (result.success) {
        setCredentials(credentials.filter(c => c.id !== credentialId))
        setSuccessMessage('Credential deleted successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(result.error || 'Failed to delete credential')
      }
    } catch (err) {
      setError('Error deleting credential')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle credential download
  const handleDownload = async (credential: Credential) => {
    try {
      setDownloadingId(credential.id)
      setError(null)

      if (!credential.credential_url) {
        setError('No document URL available')
        return
      }

      // Fetch the file from the URL
      const response = await fetch(credential.credential_url)
      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${credential.title.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()

      setSuccessMessage('Credential downloaded successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to download credential')
      console.error(err)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredCredentials = credentials.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const verifiedCount = credentials.filter(c => c.verified).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <DashboardHeader title="Academic Credentials" icon={FileText} />
          <p className="text-muted-foreground">Manage and share your verified certificates, degrees, and professional credentials</p>
        </div>
        <Button 
          onClick={() => setIsUploadOpen(!isUploadOpen)} 
          className="gap-2 md:w-auto w-full"
          disabled={isLoading}
        >
          {isUploadOpen ? (
            <>
              <MagnifyingGlass className="h-4 w-4" />
              View Credentials
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Add Credential
            </>
          )}
        </Button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success border border-success/30">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/30">
          <WarningCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isUploadOpen ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Credential</CardTitle>
              <CardDescription>Add a certificate, degree, or professional credential to your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialUpload 
                userId={userId}
                onUploadSuccess={() => {
                  setIsUploadOpen(false)
                  refreshCredentials()
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Credentials</p>
                  <p className="text-3xl font-bold">{credentials.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Verified</p>
                  <p className="text-3xl font-bold text-success">{verifiedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-warning">{credentials.length - verifiedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Shareable</p>
                  <p className="text-3xl font-bold text-info">{credentials.filter(c => c.verified).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search credentials by name or issuer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Credentials List */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-56" />
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : filteredCredentials.length > 0 ? (
              filteredCredentials.map((credential) => (
                <Card
                  key={credential.id}
                  className={`hover:shadow-lg transition-all duration-200 border-l-4 ${credential.verified ? 'border-l-success' : 'border-l-warning'}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left Section - Icon and Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg break-words">{credential.title}</h3>
                            {credential.verified ? (
                              <Badge className="bg-success/15 text-success border-success/40 gap-1 flex-shrink-0">
                                <ShieldCheckIcon className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 flex-shrink-0 bg-warning/20 text-warning border-warning/45">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">{credential.institution}</p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-2 text-xs text-muted-foreground">
                            <span>Type: {credential.type || 'Certificate'}</span>
                            <span>•</span>
                            <span suppressHydrationWarning>
                              Issued: {formatDate(credential.issue_date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end md:justify-start">
                        {credential.credential_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="gap-1"
                          >
                            <a 
                              href={credential.credential_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ArrowSquareOut className="h-4 w-4" />
                              <span className="hidden sm:inline">View</span>
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(credential)}
                          disabled={downloadingId === credential.id || !credential.credential_url}
                          className="gap-1"
                        >
                          {downloadingId === credential.id ? (
                            <>
                              <SpinnerGap className="h-4 w-4 animate-spin" />
                              <span className="hidden sm:inline">Downloading...</span>
                            </>
                          ) : (
                            <>
                              <DownloadSimple className="h-4 w-4" />
                              <span className="hidden sm:inline">Download</span>
                            </>
                          )}
                        </Button>
                        {credential.verified && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(credential.id)}
                          disabled={deletingId === credential.id}
                          className="gap-1"
                        >
                          {deletingId === credential.id ? (
                            <>
                              <SpinnerGap className="h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <Trash className="h-4 w-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Credentials Found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                    {searchQuery 
                      ? 'No credentials match your search. Try adjusting your filter.'
                      : "You haven't uploaded any academic credentials yet. Add your certificates to build your professional profile."}
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)}className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Upload Your First Credential
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Card */}
          {credentials.length > 0 && (
            <Card className="bg-info/10 border-info/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-info">
                    <p className="font-medium mb-1">Profile Visibility</p>
                    <p>Your verified credentials are visible to employers and recruiters in your public profile. Only verified credentials can be shared.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

