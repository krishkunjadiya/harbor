import { getFaculty, getAdminStaff } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import MembersClient from "./members-client"

export default async function MembersPage() {
  const profile = await requireRouteUserType(['university'])

  // Fetch actual members from database
  const faculty = await getFaculty(profile.id) || []
  const adminStaff = await getAdminStaff(profile.id) || []

  return <MembersClient initialMembers={{ faculty, adminStaff }} />
}
