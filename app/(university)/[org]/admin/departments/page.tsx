import { getDepartments } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import DepartmentsClient from "./departments-client"

export default async function DepartmentsPage() {
  const profile = await requireRouteUserType(['university'])

  // Fetch actual departments from database
  const departments = await getDepartments(profile.id) || []

  return <DepartmentsClient initialDepartments={departments} />
}
