import Link from "next/link"
import { redirect } from "next/navigation"
import { searchStudents } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { DashboardHeader } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react/dist/ssr"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default async function FacultyStudentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['university'])

  if (!profile || profile.user_type !== "university" || profile.role?.toLowerCase() !== "faculty") {
    redirect(`/${org}/login`)
  }

  const allStudents = await searchStudents("", 200)
  const students = (allStudents || []).filter((student: any) => toSlug(String(student.university || "")) === org)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Students" icon={FacultyIcon} />
        <p className="text-muted-foreground">Browse students and open full profile details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>University Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Graduation</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No students found for this university
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell>{student.profiles?.email || "N/A"}</TableCell>
                    <TableCell>{student.major || student.program || "Undeclared"}</TableCell>
                    <TableCell>{student.graduation_year || "N/A"}</TableCell>
                    <TableCell>{student.gpa || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Student</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${org}/faculty/students/${student.profile_id || student.profiles?.id || student.id}`}>
                          Full Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
