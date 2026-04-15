import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User,
  GraduationCap,
  EnvelopeSimple as Envelope,
  Phone,
  MapPin,
  LinkedinLogo as LinkedinIcon,
  GithubLogo as GithubIcon,
  Calendar,
  TrendUp,
  FileText,
  Medal,
  Trophy as TrophyIcon } from "@phosphor-icons/react/dist/ssr"
import {
  getSavedCandidateStudentIds,
  getStudentProfile,
} from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SaveCandidateButton } from "@/components/save-candidate-button"

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string; org: string }> }) {
  const { id, org } = await params
  const profile = await requireRouteUserType(['recruiter'])

  const user = await getStudentProfile(id)
  
  if (!user) {
    redirect(`/${org}/search`)
  }

  const isSaved = (await getSavedCandidateStudentIds(profile.id, [id])).includes(id)

  // Get student profile data
  const candidateData = user.students || {}
  const skills = candidateData.skills || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.full_name}</h1>
            </div>
            <p className="text-muted-foreground mb-2">{candidateData.major || 'Computer Science'} • {candidateData.university || 'University'}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Envelope className="h-4 w-4" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
              )}
              {candidateData.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {candidateData.location}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <SaveCandidateButton candidateId={id} isSaved={isSaved} />
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/${org}/search`}>
              Back to Search
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidateData.gpa || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graduation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{candidateData.graduation_year || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Expected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completeness</CardTitle>
            <TrendUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length > 0 ? 'Good' : 'Basic'}</div>
            <p className="text-xs text-muted-foreground">Based on skills and profile data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">Listed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{candidateData.bio || 'No bio available'}</p>
              {(candidateData.linkedin || candidateData.github || candidateData.resume_url) && (
                <div className="flex gap-3">
                  {candidateData.linkedin && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={candidateData.linkedin} target="_blank" rel="noopener noreferrer">
                        <LinkedinIcon className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {candidateData.github && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={candidateData.github} target="_blank" rel="noopener noreferrer">
                        <GithubIcon className="h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {candidateData.resume_url && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={candidateData.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                        View Resume
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{candidateData.major || 'Computer Science'}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{candidateData.university || 'University'}</p>
                  <p className="text-sm font-medium">GPA: {candidateData.gpa || 'N/A'}/4.0</p>
                  <p className="text-sm text-muted-foreground">Expected Graduation: {candidateData.graduation_year || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>Skills listed by the candidate</CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-info/10 text-info rounded-md text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  )
}

