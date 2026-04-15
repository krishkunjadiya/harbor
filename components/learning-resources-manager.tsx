'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { createLearningResource, deleteLearningResource } from '@/lib/actions/learning-resources-admin'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash, Plus, FileVideo, FileText, Link, BookOpen } from '@phosphor-icons/react'

export function LearningResourcesManager({ initialResources, role }: { initialResources: any[], role: string }) {
  const [resources, setResources] = useState(initialResources || [])
  const [isUploading, setIsUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    category: '' })
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      let finalUrl = externalUrl
      let finalDuration = null
      let finalFileSize = null

      if (formData.type !== 'link' && file) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${formData.type}s/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('learning_resources')
          .upload(filePath, file)

        if (uploadError) throw new Error(uploadError.message)

        const { data: { publicUrl } } = supabase.storage
          .from('learning_resources')
          .getPublicUrl(filePath)

        finalUrl = publicUrl
        finalFileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }

      if (!finalUrl) {
        throw new Error('Please provide either a file or a valid external URL.')
      }

      // Create Database Record
      const result = await createLearningResource({
        ...formData,
        url: finalUrl,
        fileSize: finalFileSize,
        duration: finalDuration,
        author: role === 'faculty' ? 'Faculty Member' : 'University Admin'
      })

      if (!result.success) throw new Error(result.error)

      setResources([result.data, ...resources])
      setIsOpen(false)
      setFormData({ title: '', description: '', type: 'document', category: '' })
      setFile(null)
      setExternalUrl('')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      // If it's a hosted file, remove from storage
      if (url.includes('supabase.co/storage')) {
        const pathMatch = url.match(/learning_resources\/(.+)/)
        if (pathMatch) {
          await supabase.storage.from('learning_resources').remove([pathMatch[1]])
        }
      }

      await deleteLearningResource(id)
      setResources(resources.filter(r => r.id !== id))
    } catch (err) {
      console.error(err)
      alert("Failed to delete resource")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Learning Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddResource} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="document">Document (PDF)</option>
                    <option value="video">Video</option>
                    <option value="book">Book (PDF/EPUB)</option>
                    <option value="link">External Link</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input required placeholder="e.g. Frontend, Interview Prep" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>

              {formData.type === 'link' ? (
                <div className="space-y-2">
                  <Label>External URL</Label>
                  <Input type="url" required placeholder="https://..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>File Upload (or Web Link)</Label>
                  <div className="flex flex-col gap-2">
                    <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground text-center">--- OR ---</p>
                    <Input type="url" placeholder="Paste external link instead" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={isUploading}>
                {isUploading ? 'Uploading safely to Harbor...' : 'Publish Resource'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No dynamic learning resources uploaded yet. Add some to populate the student dashboard.
          </div>
        ) : resources.map((resource) => (
          <Card key={resource.id} className="relative group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex gap-2 text-sm font-medium text-muted-foreground mb-2">
                  {resource.type === 'video' && <FileVideo className="h-5 w-5 text-destructive" />}
                  {resource.type === 'document' && <FileText className="h-5 w-5 text-info" />}
                  {resource.type === 'book' && <BookOpen className="h-5 w-5 text-primary" />}
                  {resource.type === 'link' && <Link className="h-5 w-5 text-success" />}
                  <span className="capitalize">{resource.type}</span> • {resource.category}
                </div>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(resource.id, resource.url)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
              <div className="flex gap-3 text-xs mt-4">
                {resource.fileSize && <span>{resource.fileSize}</span>}
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                  View Content &rarr;
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
