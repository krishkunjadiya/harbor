import { HelpSupportClient } from '@/app/(dashboard)/help/help-support-client'

export default async function RecruiterHelpPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">Find answers and get help when you need it</p>
        </div>
      </div>

      <HelpSupportClient org={org} />
    </div>
  )
}
