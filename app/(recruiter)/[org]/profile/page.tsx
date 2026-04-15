import { redirect } from "next/navigation"
import { getRecruiterProfile } from "@/lib/actions/database"
import { requireRouteUserType } from "@/lib/auth/route-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Buildings as Building2, Globe, Users, Suitcase as Briefcase, EnvelopeSimple as Mail, User } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"

export default async function RecruiterProfilePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const profile = await requireRouteUserType(['recruiter'])

  const recruiterProfile = await getRecruiterProfile(profile.id)

  if (!recruiterProfile) {
    redirect('/login')
  }

  const fullName = profile.full_name || 'N/A'
  const email = profile.email || 'N/A'
  const company = recruiterProfile.recruiters?.company || 'N/A'
  const jobTitle = recruiterProfile.recruiters?.job_title || 'N/A'
  const companySize = recruiterProfile.recruiters?.company_size || 'N/A'
  const industry = recruiterProfile.recruiters?.industry || 'N/A'
  const companyWebsite = recruiterProfile.recruiters?.company_website || 'N/A'

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your recruiter profile information
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <CardDescription className="text-base">{jobTitle} at {company}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base">{fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Company Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-base">{company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="text-base">{jobTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                  <p className="text-base">{companySize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-base">
                    <Badge variant="secondary">{industry}</Badge>
                  </p>
                </div>
              </div>
              {companyWebsite !== 'N/A' && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Website</p>
                    <a 
                      href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline"
                    >
                      {companyWebsite}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organization</p>
              <p className="text-base font-medium">{org}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge className="mt-1">Recruiter</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="text-base font-mono text-sm">{profile.id.slice(0, 20)}...</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Created</p>
              <p className="text-base">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

