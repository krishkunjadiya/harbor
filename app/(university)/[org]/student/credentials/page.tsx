import { StudentCredentialsClient } from './student-credentials-client'
import { getUserCredentials } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { DashboardHeader } from "@/components/header"
import { Certificate as CredentialIcon } from "@phosphor-icons/react/dist/ssr"


export default async function StudentCredentialsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['university'])

  const credentials = await getUserCredentials(profile.id)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <DashboardHeader title="My Credentials" icon={CredentialIcon} />
          <p className="text-muted-foreground">View your certificates, credentials, and achievements</p>
        </div>
      </div>

      <StudentCredentialsClient credentials={credentials} studentId={profile.id} org={org} />
    </div>
  )
}

