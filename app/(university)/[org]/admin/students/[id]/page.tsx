import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getAcademicRecords,
  getStudentCourses,
  getStudentProfile,
  getStudentProjects,
  getUserCredentials,
} from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { StudentDetailsView } from "@/components/student/student-details-view"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default async function AdminStudentDetailsPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>
}) {
  const { org, id } = await params
  const profile = await requireRouteUserType(['university'])

  if (!profile || profile.user_type !== "university" || profile.role?.toLowerCase() === "faculty") {
    redirect(`/${org}/login`)
  }

  const supabase = await createClient()
  const { data: university } = await supabase
    .from("universities")
    .select("id, university_name")
    .eq("id", profile.id)
    .single()

  let adminUniversityName = String(university?.university_name || "")
  if (!adminUniversityName) {
    const { data: universities } = await supabase
      .from("universities")
      .select("university_name")

    const matchedUniversity = (universities || []).find((item: any) => toSlug(String(item.university_name || "")) === org)
    adminUniversityName = String(matchedUniversity?.university_name || "")
  }

  const studentProfile = await getStudentProfile(id)
  if (!studentProfile?.id || !studentProfile?.students) {
    redirect(`/${org}/admin/students`)
  }

  const adminUniversitySlug = toSlug(String(adminUniversityName || ""))
  const studentUniversitySlug = toSlug(String(studentProfile.students.university || ""))
  if (adminUniversitySlug && studentUniversitySlug && adminUniversitySlug !== studentUniversitySlug) {
    redirect(`/${org}/admin/students`)
  }

  const [credentials, courses, records, projects] = await Promise.all([
    getUserCredentials(id),
    getStudentCourses(id),
    getAcademicRecords(id),
    getStudentProjects(id),
  ])

  return (
    <StudentDetailsView
      role="admin"
      org={org}
      studentId={id}
      profile={studentProfile}
      student={studentProfile.students}
      credentials={credentials || []}
      courses={courses || []}
      records={records || []}
      projects={projects || []}
      backHref={`/${org}/admin/students`}
    />
  )
}