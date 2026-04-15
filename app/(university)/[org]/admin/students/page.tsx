import StudentManagementClient from "./student-management-client"
import { requireRouteUserType } from "@/lib/auth/route-context"

export const metadata = {
  title: "Student Enrollment | University Admin",
  description: "Manage student records and enrollment" }

export default async function StudentEnrollmentPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  await requireRouteUserType(['university'])

  return (
    <div className="p-6">
      <StudentManagementClient org={org} />
    </div>
  )
}
