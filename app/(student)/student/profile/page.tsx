import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnvelopeSimple, Phone, MapPin, Calendar, GraduationCap, ArrowSquareOut, PencilSimple } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { getStudentProfile, getUserCredentials, getStudentTaxonomySkills } from '@/lib/actions/database'
import { requireRouteUserType } from '@/lib/auth/route-context'
import { DashboardHeader } from "@/components/header"
import { User } from "@phosphor-icons/react/dist/ssr"

export default async function StudentProfilePage() {
  const profile = await requireRouteUserType(['student'])

  const studentData = await getStudentProfile(profile.id)
  const credentials = await getUserCredentials(profile.id) || []
  const userSkills = await getStudentTaxonomySkills(profile.id) || []

  const student = studentData?.students

  // Calculate profile completeness
  const calculateCompleteness = () => {
    let score = 0
    let total = 0

    const fields = [
      profile.full_name,
      profile.email,
      profile.phone,
      profile.avatar_url,
      student?.bio,
      student?.university,
      student?.major,
      student?.graduation_year,
      student?.gpa,
      userSkills?.length > 0,
      student?.linkedin_url,
      student?.github_url,
      student?.resume_url
    ]

    fields.forEach(field => {
      total++
      if (field) score++
    })

    return Math.round((score / total) * 100)
  }

  const profileCompleteness = calculateCompleteness()

  // Extract skills from student_taxonomy_skills table
  const technicalSkills = userSkills.map((s: any) => s.skills_taxonomy?.title).filter(Boolean) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <DashboardHeader title="My Profile" icon={User} />
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>
        <Button asChild>
          <Link href="/student/profile/edit">
            <PencilSimple className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'User'} />}
              <AvatarFallback className="text-2xl">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name || 'Student'}</h2>
                <p className="text-muted-foreground">{student?.major ? `${student.major} Student` : 'Student'}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeSimple className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {student?.university && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{student.university}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm" suppressHydrationWarning>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Profile Completeness</p>
                <p className="text-2xl font-bold text-primary">{profileCompleteness}%</p>
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${profileCompleteness}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="about" className="space-y-5">
        <TabsList className="h-auto w-fit flex-wrap gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
          <TabsTrigger value="education" className="rounded-lg">Education</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {student?.bio || 'No bio provided yet. Click "Edit Profile" to add your bio.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {student?.github_url && (
                  <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ArrowSquareOut className="h-4 w-4" />
                    GitHub Profile
                  </a>
                )}
                {student?.linkedin_url && (
                  <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ArrowSquareOut className="h-4 w-4" />
                    LinkedIn Profile
                  </a>
                )}
                {student?.portfolio_url && (
                  <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ArrowSquareOut className="h-4 w-4" />
                    Portfolio Website
                  </a>
                )}
                {!student?.github_url && !student?.linkedin_url && !student?.portfolio_url && (
                  <p className="text-sm text-muted-foreground">No links added yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
              <CardTitle>Education History</CardTitle>
              <CardDescription>Summary only. Manage full education and credentials in the Credentials page.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/credentials">
                  <PencilSimple className="h-4 w-4 mr-2" />
                  Manage Credentials
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {student?.university || student?.major ? (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{student?.major || 'Major Not Specified'}</h3>
                      <p className="text-sm text-muted-foreground">{student?.university || 'University Not Specified'}</p>
                      {student?.graduation_year && (
                        <p className="text-sm text-muted-foreground">Expected Graduation: {student.graduation_year}</p>
                      )}
                      {student?.gpa && (
                        <p className="text-sm">GPA: {student.gpa}/4.0</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No education information added yet</p>
              )}

              <div className="mt-6 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Credentials on file</p>
                <p className="text-2xl font-semibold">{credentials.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Open Credentials to view, add, verify, or edit entries.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Technical Skills</CardTitle>
                <CardDescription>Summary only. Manage your full skill profile in Skills.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/skills">
                  <PencilSimple className="h-4 w-4 mr-2" />
                  Manage Skills
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {technicalSkills.length > 0 ? (
                <>
                <p className="text-sm text-muted-foreground mb-3">
                  {technicalSkills.length} skill{technicalSkills.length === 1 ? '' : 's'} listed
                </p>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.slice(0, 8).map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                  {technicalSkills.length > 8 && (
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      +{technicalSkills.length - 8} more
                    </span>
                  )}
                </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">No skills added yet.</p>
                  <Button asChild>
                    <Link href="/student/skills">Add Skills</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

