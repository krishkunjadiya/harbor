import type React from "react"
import { HarborSidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar-ui"
import { ScrollArea } from "@/components/ui/scroll-area"
import { requireRouteUserType } from "@/lib/auth/route-context"

export default async function StudentLayout({
  children }: {
  children: React.ReactNode
}) {
  await requireRouteUserType(['student'])

  return (
    <SidebarProvider portal="student">
      <HarborSidebar />
      <ScrollArea className="flex-1">
        <main className="p-4 md:ps-2">
          {children}
        </main>
      </ScrollArea>
    </SidebarProvider>
  )
}
