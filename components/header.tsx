import React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar-ui"
import { cn } from "@/lib/utils"

type Props = {
  title: React.ReactNode
  icon: React.ElementType
  className?: string
}

export function DashboardHeader({ title, icon: IconComponent, className }: Props) {
  return (
    <div className={cn("relative flex items-center justify-center gap-x-2.5 md:justify-start", className)}>
      <SidebarTrigger className="absolute left-0 md:hidden" />
      <IconComponent weight="light" className="size-5 text-muted-foreground" />
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
    </div>
  )
}
