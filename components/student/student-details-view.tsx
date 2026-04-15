import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  GraduationCap,
  EnvelopeSimple as Envelope,
  Phone,
  MapPin,
  Calendar,
  TrendUp,
  FileText,
  BookOpen,
  ArrowLeft,
  Certificate,
  LinkedinLogo as LinkedinIcon,
  GithubLogo as GithubIcon,
} from "@phosphor-icons/react/dist/ssr"

type ViewerRole = "admin" | "faculty"

interface StudentDetailsViewProps {
  role: ViewerRole
  org: string
  studentId: string
  profile: any
  student: any
  credentials: any[]
  courses: any[]
  records: any[]
  projects: any[]
  backHref: string
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString()
}

export function StudentDetailsView({
  role,
  org,
  studentId,
  profile,
  student,
  credentials,
  courses,
  records,
  projects,
  backHref,
}: StudentDetailsViewProps) {
  const fullName = profile?.full_name || "Unknown Student"
  const email = profile?.email || "N/A"
  const showPhone = role === "admin"
  const skills = Array.isArray(student?.skills) ? student.skills : []
  const roleLabel = role === "admin" ? "Admin View" : "Faculty View"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{fullName}</h1>
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              {student?.major || student?.program || "Undeclared"} • {student?.university || org}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Envelope className="h-4 w-4" />
                {email}
              </div>
              {showPhone && profile?.phone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </div>
              )}
              {student?.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {student.location}
                </div>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student?.gpa || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graduation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{student?.graduation_year || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Expected year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credentials</CardTitle>
            <Certificate className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials.length}</div>
            <p className="text-xs text-muted-foreground">Issued certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">Listed by student</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="academics" className="rounded-lg">Academics</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg">Projects</TabsTrigger>
          <TabsTrigger value="credentials" className="rounded-lg">Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Student</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{student?.bio || "No bio available"}</p>
              {(student?.linkedin || student?.github || student?.resume_url) && (
                <div className="flex flex-wrap gap-3">
                  {student?.linkedin && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={student.linkedin} target="_blank" rel="noopener noreferrer">
                        <LinkedinIcon className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {student?.github && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={student.github} target="_blank" rel="noopener noreferrer">
                        <GithubIcon className="h-4 w-4" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {student?.resume_url && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={student.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                        View Resume
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skill Set</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, index: number) => (
                    <span
                      key={`${skill}-${index}`}
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

        <TabsContent value="academics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>Current and past enrolled courses</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.map((course: any) => (
                    <div key={course.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <p className="font-medium">
                            {course.course?.code || course.course?.course_code || "N/A"} - {course.course?.name || course.course?.course_name || "Course"}
                          </p>
                        </div>
                        <Badge variant="outline">{course.status || "active"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Enrolled on {formatDate(course.enrollment_date || course.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No course enrollments found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Records</CardTitle>
              <CardDescription>Grades and semester performance</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <div className="space-y-3">
                  {records.map((record: any) => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {record.course?.code || record.course?.course_code || "N/A"} - {record.course?.name || record.course?.course_name || "Course"}
                        </p>
                        <Badge variant="outline">Grade: {record.grade || "N/A"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Semester: {record.semester || "N/A"} • Credits: {record.credits || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No academic records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Projects</CardTitle>
              <CardDescription>Portfolio and capstone work</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project: any) => {
                    const title = project.title || project.project_title || project.name || "Untitled Project"
                    const description = project.description || project.summary || "No description provided"

                    return (
                      <div key={project.id} className="p-3 border rounded-lg">
                        <p className="font-medium mb-1">{title}</p>
                        <p className="text-sm text-muted-foreground mb-2">{description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Status: {project.status || "ongoing"}</span>
                          <span>•</span>
                          <span>Updated: {formatDate(project.updated_at || project.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>Issued certificates and records</CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length > 0 ? (
                <div className="space-y-3">
                  {credentials.map((credential: any) => (
                    <div key={credential.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Certificate className="h-4 w-4 text-primary" />
                        <p className="font-medium">
                          {credential.title || credential.name || credential.credential_name || "Credential"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {credential.description || "No description provided"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Issued: {formatDate(credential.issued_at || credential.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No credentials issued yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}