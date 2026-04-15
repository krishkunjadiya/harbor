"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Collapsible from "@radix-ui/react-collapsible"
import { useSidebar } from "@/components/ui/sidebar-ui"
import { useAuth } from "@/lib/auth/auth-provider"
import { resolveShellFromPathname } from "@/lib/navigation/shell"
import {
  SquaresFour,
  Users,
  GearSix,
  SignOut,
  GraduationCap,
  Medal,
  TrendUp,
  FileText,
  User,
  UserCircle,
  Lock,
  Megaphone,
  ShieldStar,
  BookOpen,
  Briefcase,
  MagnifyingGlass,
  Buildings,
  UsersThree,
  ChartBar,
  Bell,
  ClipboardText,
  Question,
  VideoCamera,
  Calendar,
  ChatCircle,
  ChartLine,
  BookmarkSimple,
  ShieldCheck,
  CaretDown } from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarSeparator } from "@/components/ui/sidebar-ui"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AnimatePresence, motion } from "motion/react"
import React from "react"
import { toast } from "sonner"

// Student Section Navigation
const studentNavItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: SquaresFour },
  { name: "Profile", href: "/student/profile", icon: User },
  { name: "Skills", href: "/student/skills", icon: TrendUp },
  { name: "Jobs", href: "/student/jobs", icon: Briefcase },
  { name: "Applications", href: "/student/applications", icon: ClipboardText },
  { name: "Resume Review (AI)", href: "/student/resume-analyzer", icon: FileText },
  { name: "Resume Builder (Editor)", href: "/student/resume-builder", icon: FileText },
  { name: "Career Insights", href: "/student/career-insights", icon: ChartBar },
  { name: "Learning Resources", href: "/student/learning-resources", icon: BookOpen },
  { name: "Interview Prep", href: "/student/interview-prep", icon: VideoCamera },
  { name: "Credentials", href: "/student/credentials", icon: ShieldCheck },
]

const studentFooterNavItems = [
  { name: "Notifications", href: "/student/notifications", icon: Bell },
  { name: "Help", href: "/student/help", icon: Question },
]

const studentSettingsSubItems = [
  { name: "Profile", href: "/student/settings/profile" },
  { name: "Security", href: "/student/settings/security" },
  { name: "Communication", href: "/student/settings/communication" },
  { name: "Permissions", href: "/student/settings/permissions" },
]

// System Admin Navigation
const adminNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: SquaresFour },
  { name: "Users", href: "/users", icon: Users },
]

const adminFooterNavItems = [
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Help", href: "/help", icon: Question },
]

const adminSettingsSubItems = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Security", href: "/settings/security" },
  { name: "Communication", href: "/settings/communication" },
  { name: "Permissions", href: "/settings/permissions" },
]

// University Admin Navigation (dynamic with org)
const getUniversityAdminNav = (org: string) => [
  { name: "Admin Dashboard", href: `/${org}/admin/dashboard`, icon: SquaresFour },
  { name: "Departments", href: `/${org}/admin/departments`, icon: Buildings },
  { name: "University Members", href: `/${org}/admin/members`, icon: UsersThree },
  { name: "Students", href: `/${org}/admin/students`, icon: GraduationCap },
  { name: "Faculty", href: `/${org}/admin/faculty`, icon: GraduationCap },
  { name: "Learning Resources", href: `/${org}/admin/learning-resources`, icon: BookOpen },
  { name: "Settings", href: `/${org}/admin/settings`, icon: GearSix },
]

// University Faculty Navigation
const getUniversityFacultyNav = (org: string) => [
  { name: "Faculty Dashboard", href: `/${org}/faculty/dashboard`, icon: SquaresFour },
  { name: "Profile", href: `/${org}/faculty/profile`, icon: User },
  { name: "Student Advising", href: `/${org}/faculty/students`, icon: Users },
  { name: "Courses", href: `/${org}/faculty/courses`, icon: BookOpen },
  { name: "Academic Records", href: `/${org}/faculty/academic-records`, icon: FileText },
  { name: "Capstone Projects", href: `/${org}/faculty/capstones`, icon: Medal },
  { name: "Assignments", href: `/${org}/faculty/assignments`, icon: ClipboardText },
  { name: "Learning Resources", href: `/${org}/faculty/learning-resources`, icon: BookOpen },
  { name: "Enrollments", href: `/${org}/faculty/enrollments`, icon: UsersThree },
]

// University Student Navigation
const getUniversityStudentNav = (org: string) => [
  { name: "Student Dashboard", href: `/${org}/student/dashboard`, icon: SquaresFour },
  { name: "Profile", href: `/${org}/student/settings/profile`, icon: User },
  { name: "Academic Records", href: `/${org}/student/records`, icon: ChartLine },
  { name: "Projects", href: `/${org}/student/projects`, icon: BookOpen },
  { name: "Assignments", href: `/${org}/student/assignments`, icon: ClipboardText },
  { name: "Enrollment", href: `/${org}/student/enrollment`, icon: GraduationCap },
  { name: "Credentials", href: `/${org}/student/credentials`, icon: ShieldCheck },
]

// Recruiter Navigation
const getRecruiterNav = (org: string) => [
  { name: "Dashboard", href: `/${org}/dashboard`, icon: SquaresFour },
  { name: "Job Postings", href: `/${org}/jobs`, icon: Briefcase },
  { name: "Search Candidates", href: `/${org}/search`, icon: MagnifyingGlass },
  { name: "Candidate Pipeline", href: `/${org}/applications`, icon: ClipboardText },
  { name: "Shortlisted", href: `/${org}/saved-candidates`, icon: BookmarkSimple },
  { name: "Interviews", href: `/${org}/interviews`, icon: Calendar },
  { name: "Analytics", href: `/${org}/analytics`, icon: ChartBar },
  { name: "Team", href: `/${org}/team`, icon: ChatCircle },
  { name: "Reports", href: `/${org}/reports`, icon: ChartLine },
]

const getUniversityFooterItems = (org: string, role: "admin" | "faculty" | "student") => [
  { name: "Notifications", href: `/${org}/${role}/notifications`, icon: Bell },
  { name: "Help", href: `/${org}/${role}/help`, icon: Question },
]

const getUniversitySettingsSubItems = (org: string, role: "admin" | "faculty" | "student") => [
  { name: "Profile", href: `/${org}/${role}/settings/profile` },
  { name: "Security", href: `/${org}/${role}/settings/security` },
  { name: "Communication", href: `/${org}/${role}/settings/communication` },
  { name: "Permissions", href: `/${org}/${role}/settings/permissions` },
]

const getRecruiterFooterItems = (org: string) => [
  { name: "Notifications", href: `/${org}/notifications`, icon: Bell },
  { name: "Help", href: `/${org}/help`, icon: Question },
]

const getRecruiterSettingsSubItems = (org: string) => [
  { name: "Profile", href: `/${org}/settings/profile` },
  { name: "Security", href: `/${org}/settings/security` },
  { name: "Communication", href: `/${org}/settings/communication` },
  { name: "Permissions", href: `/${org}/settings/permissions` },
]

import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

type NavItem = {
  name: string
  href: string
  icon: PhosphorIcon
  openInNewTab?: boolean
}

type SettingsSubItem = {
  name: string
  href: string
}

function SidebarNavItemList({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const currentPath = pathname ?? ""

  const isActiveNavItem = (href: string) => {
    const hrefPath = href.split("?")[0]
    return currentPath === hrefPath || currentPath.startsWith(hrefPath + "/")
  }

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={isActiveNavItem(item.href)}
            tooltip={item.name}
          >
            <Link
              href={item.href}
              prefetch={false}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
            >
              <item.icon className="size-4" />
              <span className="shrink-0 transition-[margin,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:-ms-8 group-data-[collapsible=icon]:opacity-0">
                {item.name}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

const MemoizedSidebarNavItemList = React.memo(SidebarNavItemList)

function SettingsSubMenu({ subItems }: { subItems: SettingsSubItem[] }) {
  const pathname = usePathname()
  const currentPath = pathname ?? ""
  const isAnySubActive = subItems.some((item) => currentPath === item.href || currentPath.startsWith(item.href + "/"))
  const [open, setOpen] = React.useState(isAnySubActive)

  return (
    <SidebarMenu>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <SidebarMenuItem>
          <Collapsible.Trigger asChild>
            <SidebarMenuButton
              tooltip="Settings"
              isActive={isAnySubActive}
            >
              <GearSix className="size-4" />
              <span className="shrink-0 transition-[margin,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:-ms-8 group-data-[collapsible=icon]:opacity-0">
                Settings
              </span>
              <CaretDown
                className={`ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                  open ? "rotate-180" : ""
                }`}
              />
            </SidebarMenuButton>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <SidebarMenuSub>
              {subItems.map((item) => (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentPath === item.href || currentPath.startsWith(item.href + "/")}
                  >
                    <Link href={item.href} prefetch={false}>
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </Collapsible.Content>
        </SidebarMenuItem>
      </Collapsible.Root>
    </SidebarMenu>
  )
}

const MemoizedSettingsSubMenu = React.memo(SettingsSubMenu)

export function HarborSidebar() {
  const pathname = usePathname()
  const currentPath = pathname ?? ""
  const { portal, org: declaredOrg, universityRole, state } = useSidebar()
  const { signOut, user } = useAuth()
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  const shell = resolveShellFromPathname(currentPath, {
    portal,
    org: declaredOrg,
    universityRole })

  let navItems: NavItem[] = []
  let footerNavItems: NavItem[] = []
  let settingsSubItems: SettingsSubItem[] = []
  let sidebarTitle = "Harbor"

  if (shell.portal === "admin") {
    navItems = adminNavItems
    footerNavItems = adminFooterNavItems
    settingsSubItems = adminSettingsSubItems
    sidebarTitle = "Harbor Admin"
  } else if (shell.portal === "university" && shell.org) {
    if (shell.universityRole === "faculty") {
      navItems = getUniversityFacultyNav(shell.org)
      footerNavItems = getUniversityFooterItems(shell.org, "faculty")
      settingsSubItems = getUniversitySettingsSubItems(shell.org, "faculty")
      sidebarTitle = "Faculty Portal"
    } else if (shell.universityRole === "student") {
      navItems = getUniversityStudentNav(shell.org)
      footerNavItems = getUniversityFooterItems(shell.org, "student")
      settingsSubItems = getUniversitySettingsSubItems(shell.org, "student")
      sidebarTitle = "Student Portal"
    } else {
      navItems = getUniversityAdminNav(shell.org)
      footerNavItems = getUniversityFooterItems(shell.org, "admin")
      settingsSubItems = getUniversitySettingsSubItems(shell.org, "admin")
      sidebarTitle = "University Admin"
    }
  } else if (shell.portal === "recruiter") {
    const recruiterOrg = shell.org || "company"
    navItems = getRecruiterNav(recruiterOrg)
    footerNavItems = getRecruiterFooterItems(recruiterOrg)
    settingsSubItems = getRecruiterSettingsSubItems(recruiterOrg)
    sidebarTitle = "Recruiter Portal"
  } else if (shell.portal === "student") {
    navItems = studentNavItems
    footerNavItems = studentFooterNavItems
    settingsSubItems = studentSettingsSubItems
    sidebarTitle = "Harbor Student"
  }

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ")
      return names.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U"
  }

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('[AUTH] Sidebar sign out failed:', error)
      toast.error('Unable to sign out right now. Please try again.')
      setIsSigningOut(false)
    }
  }

  // Render a deterministic shell on SSR/first client render to avoid Radix ID hydration mismatches.
  if (!isHydrated) {
    return (
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-auto justify-center" asChild>
                <Link href="/landing" prefetch={false}>
                  <GraduationCap className="size-6" weight="light" />
                  <span className="sr-only">{sidebarTitle}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{sidebarTitle}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 6 }).map((_, index) => (
                  <SidebarMenuItem key={`sidebar-placeholder-${index}`}>
                    <div className="h-8 rounded-md bg-sidebar-accent/40" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="gap-y-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="h-10 rounded-md bg-sidebar-accent/40" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto justify-center" asChild>
              <Link href="/landing" prefetch={false}>
                <GraduationCap className="size-6" weight="light" />
                <span className="sr-only">{sidebarTitle}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{sidebarTitle}</SidebarGroupLabel>
          <SidebarGroupContent>
            <MemoizedSidebarNavItemList items={navItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        {(footerNavItems.length > 0 || settingsSubItems.length > 0) && (
          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarGroupContent>
              <MemoizedSidebarNavItemList items={footerNavItems} />
              {settingsSubItems.length > 0 && (
                <MemoizedSettingsSubMenu subItems={settingsSubItems} />
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-y-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto gap-x-3 group-data-[collapsible=icon]:!p-1">
                  <Avatar className="size-8 shrink-0 transition-all group-data-[collapsible=icon]:size-6">
                    <AvatarFallback className="group-data-[collapsible=icon]:text-[0.5rem]">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="transition-[margin,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:-ms-8 group-data-[collapsible=icon]:opacity-0">
                    <p className="font-medium">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-destructive cursor-pointer"
                >
                  <SignOut className="mr-2 size-4" />
                  {isSigningOut ? 'Signing out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <AnimatePresence>
          {state === "expanded" && (
            <motion.div
              key="copyright"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
            >
              <p className="shrink-0 p-2 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Harbor
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
