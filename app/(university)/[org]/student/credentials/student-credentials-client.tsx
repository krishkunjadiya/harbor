'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Medal, DownloadSimple as Download, ShareNetwork as ShareIcon, Calendar } from '@phosphor-icons/react'

interface StudentCredentialsClientProps {
  credentials: any[]
  studentId: string
  org: string
}

export function StudentCredentialsClient({ credentials: initialCredentials, studentId, org }: StudentCredentialsClientProps) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [selectedCredential, setSelectedCredential] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const categories = {
    certificates: credentials.filter(c => c.type === 'certificate'),
    achievements: credentials.filter(c => c.type === 'achievement'),
    credentials: credentials.filter(c => c.type === 'credential')
  }

  const stats = {
    total: credentials.length,
    certificates: categories.certificates.length,
    achievements: categories.achievements.length,
    verified: credentials.filter(c => c.verified).length
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'certificate':
        return 'bg-info/15 text-info'
      case 'achievement':
        return 'bg-success/15 text-success'
      case 'credential':
        return 'bg-primary/15 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const renderCredentialItem = (credential: any) => (
    <Card key={credential.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-32 bg-muted/40 border-b relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Medal className="h-12 w-12 text-muted-foreground/40" />
        </div>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{credential.name}</CardTitle>
            <CardDescription>{credential.issuer}</CardDescription>
          </div>
          <Badge className={getTypeColor(credential.type)}>
            {credential.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{credential.description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Issued: {new Date(credential.issuedDate).toLocaleDateString()}</span>
        </div>

        {credential.expiryDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Expires: {new Date(credential.expiryDate).toLocaleDateString()}</span>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => {
              setSelectedCredential(credential)
              setIsDetailDialogOpen(true)
            }}
          >
            View
          </Button>
          {credential.certificateUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => window.open(credential.certificateUrl)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <ShareIcon className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Medal className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.certificates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Medal className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.achievements}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Medal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.verified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Categories */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({stats.certificates})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({stats.achievements})</TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Medal className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Credentials Yet</h3>
                <p className="text-sm text-muted-foreground">Your credentials will appear here as you earn them</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {credentials.map(renderCredentialItem)}
            </div>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          {categories.certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Medal className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Certificates</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.certificates.map(renderCredentialItem)}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {categories.achievements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Medal className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Achievements</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.achievements.map(renderCredentialItem)}
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCredential?.name}</DialogTitle>
            <DialogDescription>{selectedCredential?.issuer}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedCredential?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Issued Date</p>
                <p className="font-medium">{new Date(selectedCredential?.issuedDate).toLocaleDateString()}</p>
              </div>
              {selectedCredential?.expiryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">{new Date(selectedCredential?.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {selectedCredential?.credentialUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Credential URL</p>
                <a href={selectedCredential.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-info hover:underline text-sm">
                  {selectedCredential.credentialUrl}
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {selectedCredential?.certificateUrl && (
                <Button onClick={() => window.open(selectedCredential.certificateUrl)} className="gap-2 flex-1">
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              )}
              <Button variant="outline" className="gap-2 flex-1">
                <ShareIcon className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
