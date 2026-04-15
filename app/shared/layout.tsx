import type React from "react"
import { HarborSidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar-ui"

export default function SharedLayout({
  children }: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider portal="shared">
      <HarborSidebar />
      <main className="flex-1 p-4 md:ps-2">
        {children}
      </main>
    </SidebarProvider>
  )
}
