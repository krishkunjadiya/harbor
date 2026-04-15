"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ShellPortal, UniversityShellRole } from "@/lib/navigation/shell"

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  portal: ShellPortal
  org: string | null
  universityRole: UniversityShellRole | null
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

type SidebarProviderProps = {
  children: ReactNode
  portal?: ShellPortal
  org?: string | null
  universityRole?: UniversityShellRole | null
}

export function SidebarProvider({
  children,
  portal = "unknown",
  org = null,
  universityRole = null }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => {
    setIsOpen((current) => !current)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, portal, org, universityRole }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
