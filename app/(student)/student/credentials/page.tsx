import { getUserCredentials } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { CredentialsClient } from "./credentials-client"
import { DashboardHeader } from "@/components/header"
import { ShieldCheck as ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"

export const metadata = {
  title: "My Credentials | Harbor",
  description: "View and manage your academic certificates and degrees" }

export default async function StudentCredentialsPage() {
  const profile = await requireRouteUserType(['student'])

  const credentials = await getUserCredentials(profile.id)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="My Credentials" icon={ShieldCheckIcon} />
        <p className="text-muted-foreground">View and manage your academic certificates and degrees</p>
      </div>
      <CredentialsClient 
        initialCredentials={credentials as any} 
        userId={profile.id} 
      />
    </div>
  )
}

