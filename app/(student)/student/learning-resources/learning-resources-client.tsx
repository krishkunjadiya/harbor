'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BookOpen, VideoCamera, FileText, Link, DownloadSimple, Star } from '@phosphor-icons/react'

function getYouTubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

interface LearningResourcesClientProps {
  resources: any[]
}

export function LearningResourcesClient({ resources: initialResources }: LearningResourcesClientProps) {
  // Use passed resources prop
  const [resources, setResources] = useState(initialResources || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const normalizedSearch = searchTerm.toLowerCase()

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description?.toLowerCase()?.includes(normalizedSearch)
    const matchesType = selectedType === 'all' || r.type === selectedType
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  // Dynamically extract categories from the data
  const categories = ['all', ...Array.from(new Set(resources.map(r => r.category))).filter(Boolean)] as string[]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCamera className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      case 'link':
        return <Link className="h-5 w-5" />
      case 'book':
        return <BookOpen className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-destructive/15 text-destructive'
      case 'document':
        return 'bg-info/15 text-info'
      case 'link':
        return 'bg-success/15 text-success'
      case 'book':
        return 'bg-primary/15 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const stats = {
    total: resources.length,
    videos: resources.filter(r => r.type === 'video').length,
    documents: resources.filter(r => r.type === 'document').length,
    books: resources.filter(r => r.type === 'book').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <VideoCamera className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.videos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.documents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.books}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="book">Books</option>
            <option value="link">Links</option>
          </select>

          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm">
                  {resource.duration && (
                    <span className="text-muted-foreground">{resource.duration}</span>
                  )}
                  {resource.fileSize && (
                    <span className="text-muted-foreground">{resource.fileSize}</span>
                  )}
                  {resource.author && (
                    <span className="text-muted-foreground">{resource.author}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {resource.type === 'link' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Visit Link
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          {resource.type === 'video' ? 'Watch' : 'View Preview'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>{resource.title}</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 w-full bg-muted/20 rounded-md overflow-hidden relative">
                          {resource.type === 'video' ? (
                            resource.url.includes('youtube') || resource.url.includes('youtu.be') ? (
                              <iframe
                                src={getYouTubeEmbedUrl(resource.url)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video src={resource.url} controls className="w-full h-full object-contain bg-black" />
                            )
                          ) : (
                            <iframe src={resource.url} className="w-full h-full" />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {(resource.type === 'document' || resource.type === 'book') && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(resource.url, '_blank')}>
                      <DownloadSimple className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
