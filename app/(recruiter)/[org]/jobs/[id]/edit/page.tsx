import { getJobById } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FloppyDisk } from "@phosphor-icons/react/dist/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateJob } from "@/lib/actions/mutations"

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await requireRouteUserType(['recruiter'])

  const { org, id } = await params
  const { error } = await searchParams
  const job = await getJobById(id)

  if (!job) {
    redirect(`/${org}/jobs`)
  }

  if (job.recruiter_id !== profile.id) {
    redirect(`/${org}/jobs`)
  }

  const recruiterId = profile.id

  async function handleSaveChanges(formData: FormData) {
    'use server'

    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()

    const result = await updateJob(recruiterId, id, {
      title,
      description,
    })

    if (!result.success) {
      const message = encodeURIComponent(result.error || 'Failed to save job changes.')
      redirect(`/${org}/jobs/${id}/edit?error=${message}`)
    }

    redirect(`/${org}/jobs/${id}`)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${org}/jobs/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Job</h1>
          <p className="text-muted-foreground">Update job details for {job.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <form action={handleSaveChanges}>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {decodeURIComponent(error)}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" name="title" defaultValue={job.title} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                name="description"
                defaultValue={job.description || ''}
                className="min-h-[150px]"
                required
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${org}/jobs/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit">
                <FloppyDisk className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

