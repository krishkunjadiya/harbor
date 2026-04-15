import { getUniversityProfile, getRecruiterProfile } from "@/lib/actions/database"
import { requireRouteProfile } from "@/lib/auth/route-context"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider } from "@/components/ui/sidebar-ui"
import { HarborSidebar } from "@/components/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AdminDashboardContent } from "@/components/admin-dashboard-content"

export default async function DashboardRedirectPage() {
  const profile = await requireRouteProfile('/login')

  // Redirect based on user type and role
  // For university users, we need to distinguish between admin and faculty
  if (profile.user_type === 'university') {
    const userRole = profile.role?.toLowerCase()
    
    if (userRole === 'faculty') {
      // Get the university this faculty belongs to
      const supabase = await createClient()
      const { data: facultyData } = await supabase
        .from('faculty')
        .select('university_id')
        .eq('profile_id', profile.id)
        .single()
      
      let facultyUniversitySlug = 'university'
      if (facultyData?.university_id) {
        const { data: uniData } = await supabase
          .from('universities')
          .select('university_name')
          .eq('id', facultyData.university_id)
          .single()
        
        if (uniData?.university_name) {
          facultyUniversitySlug = uniData.university_name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        }
      }
      redirect(`/${facultyUniversitySlug}/faculty/dashboard`)
    } else {
      // Default to university admin dashboard for other university users
      const uniProfile = await getUniversityProfile(profile.id)
      const universityName = uniProfile?.universities?.university_name || 'university'
      const universitySlug = universityName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      redirect(`/${universitySlug}/admin/dashboard`)
    }
  }

  switch (profile.user_type) {
    case 'student':
      redirect('/student/dashboard')
    case 'recruiter':
      const recruiterProfile = await getRecruiterProfile(profile.id)
      const companyName = recruiterProfile?.recruiters?.company || 'company'
      const industry = recruiterProfile?.recruiters?.industry || ''
      
      // Generate a clean slug: "company-name" or "industry-id" as fallback
      let companySlug = companyName
        ?.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      if (!companySlug || companySlug === 'company') {
        // Fallback to industry + last 4 of ID if name is missing
        const industryPart = industry ? industry.toLowerCase().replace(/\s+/g, '-') : 'recruiter'
        companySlug = `${industryPart}-${profile.id.substring(0, 4)}`
      }
      
      redirect(`/${companySlug}/dashboard`)
    case 'admin':
      return (
        <SidebarProvider portal="admin">
          <HarborSidebar />
          <ScrollArea className="flex-1">
            <main className="p-4 md:ps-2">
              <AdminDashboardContent />
            </main>
          </ScrollArea>
        </SidebarProvider>
      )
    default:
      redirect('/student/dashboard')
  }
}
