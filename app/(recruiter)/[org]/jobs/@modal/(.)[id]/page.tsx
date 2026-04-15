import { getJobById } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, PencilSimple } from "@phosphor-icons/react/dist/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function RecruiterJobDetailModalPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>
}) {
  await requireRouteUserType(['recruiter'])

  const { org, id } = await params
  const job = await getJobById(id)

  if (!job) {
    redirect(`/${org}/jobs`)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm md:p-8">
      <div className="relative w-full max-w-5xl rounded-xl border bg-background p-4 shadow-2xl md:p-6">
        <Link
          href={`/${org}/jobs`}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close job details"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
              <p className="text-muted-foreground">{job.company}</p>
            </div>
            <Button asChild>
              <Link href={`/${org}/jobs/${id}/edit`}>
                <PencilSimple className="h-4 w-4 mr-2" />
                Edit Job
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none whitespace-pre-wrap">{job.description}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {job.requirements?.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Job Type</span>
                    <p>{job.job_type}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Location</span>
                    <p>{job.location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Posted Date</span>
                    <p suppressHydrationWarning>{formatDate(job.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required?.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
