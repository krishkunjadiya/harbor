export type ShellPortal = "unknown" | "student" | "recruiter" | "university" | "admin" | "shared"

export type UniversityShellRole = "admin" | "faculty" | "student"

export type DeclaredShell = {
  portal?: ShellPortal
  org?: string | null
  universityRole?: UniversityShellRole | null
}

export type ResolvedShell = {
  portal: ShellPortal
  org: string | null
  universityRole: UniversityShellRole | null
}

const topLevelSystemRoutes = new Set([
  "student",
  "dashboard",
  "landing",
  "login",
  "signup",
  "register",
  "auth",
  "shared",
  "api",
  "admin-dashboard",
  "users",
  "settings",
  "notifications",
  "help",
])

export function extractOrgFromPathname(pathname: string | null): string | null {
  if (!pathname) {
    return null
  }

  const segment = pathname.split("/").filter(Boolean)[0]
  if (!segment || topLevelSystemRoutes.has(segment)) {
    return null
  }

  return segment
}

export function resolveUniversityRoleFromPathname(pathname: string | null): UniversityShellRole | null {
  if (!pathname) {
    return null
  }

  if (pathname.includes("/admin/")) {
    return "admin"
  }

  if (pathname.includes("/faculty/")) {
    return "faculty"
  }

  if (pathname.includes("/student/")) {
    return "student"
  }

  return null
}

export function resolveShellFromPathname(pathname: string | null, declared: DeclaredShell = {}): ResolvedShell {
  const declaredPortal = declared.portal ?? "unknown"
  const pathnameOrg = extractOrgFromPathname(pathname)
  const pathnameUniversityRole = resolveUniversityRoleFromPathname(pathname)
  const org = pathnameOrg ?? declared.org ?? null
  const universityRole = pathnameUniversityRole ?? declared.universityRole ?? null

  // Pathname is the source of truth when it clearly matches a portal route.
  // This prevents stale provider state from showing another dashboard's sidebar.
  if (pathname?.startsWith("/student")) {
    return { portal: "student", org: null, universityRole: null }
  }

  if (
    pathname?.startsWith("/admin-dashboard") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/notifications") ||
    pathname?.startsWith("/help")
  ) {
    return { portal: "admin", org: null, universityRole: null }
  }

  if (pathname?.startsWith("/shared")) {
    return { portal: "shared", org: null, universityRole: null }
  }

  if (pathnameOrg && pathnameUniversityRole) {
    return { portal: "university", org: pathnameOrg, universityRole: pathnameUniversityRole }
  }

  if (pathnameOrg) {
    return { portal: "recruiter", org: pathnameOrg, universityRole: null }
  }

  if (declaredPortal !== "unknown") {
    if (declaredPortal === "university") {
      return {
        portal: declaredPortal,
        org,
        universityRole,
      }
    }

    return {
      portal: declaredPortal,
      org: declaredPortal === "recruiter" ? org : null,
      universityRole: null,
    }
  }

  return { portal: "unknown", org: null, universityRole: null }
}

export function getShellHomeHref(shell: ResolvedShell): string {
  switch (shell.portal) {
    case "student":
      return "/student/dashboard"
    case "admin":
      return "/dashboard"
    case "recruiter":
      return shell.org ? `/${shell.org}/dashboard` : "/dashboard"
    case "university":
      if (!shell.org) {
        return "/dashboard"
      }

      switch (shell.universityRole) {
        case "faculty":
          return `/${shell.org}/faculty/dashboard`
        case "student":
          return `/${shell.org}/student/dashboard`
        case "admin":
        default:
          return `/${shell.org}/admin/dashboard`
      }
    case "shared":
      return "/shared/notifications"
    default:
      return "/dashboard"
  }
}

export function getShellProfileHref(shell: ResolvedShell): string {
  switch (shell.portal) {
    case "student":
      return "/student/profile"
    case "admin":
      return "/dashboard/settings/profile"
    case "recruiter":
      return shell.org ? `/${shell.org}/profile` : "/dashboard"
    case "university":
      if (!shell.org) {
        return "/dashboard"
      }

      switch (shell.universityRole) {
        case "faculty":
          return `/${shell.org}/faculty/profile`
        case "student":
          return `/${shell.org}/student/settings/profile`
        case "admin":
        default:
          return `/${shell.org}/admin/settings/profile`
      }
    case "shared":
      return "/shared/notifications"
    default:
      return "/dashboard"
  }
}

export function getShellSettingsHref(shell: ResolvedShell): string {
  switch (shell.portal) {
    case "student":
      return "/student/settings/profile"
    case "admin":
      return "/dashboard/settings/profile"
    case "recruiter":
      return shell.org ? `/${shell.org}/settings/profile` : "/dashboard/settings/profile"
    case "university":
      if (!shell.org) {
        return "/dashboard/settings/profile"
      }

      switch (shell.universityRole) {
        case "faculty":
          return `/${shell.org}/faculty/settings/profile`
        case "student":
          return `/${shell.org}/student/settings/profile`
        case "admin":
        default:
          return `/${shell.org}/admin/settings/profile`
      }
    case "shared":
      return "/shared/notifications"
    default:
      return "/dashboard/settings/profile"
  }
}

export function getShellNotificationsHref(shell: ResolvedShell): string {
  switch (shell.portal) {
    case "student":
      return "/student/notifications"
    case "admin":
      return "/notifications"
    case "recruiter":
      return shell.org ? `/${shell.org}/notifications` : "/notifications"
    case "university":
      if (!shell.org) {
        return "/notifications"
      }

      switch (shell.universityRole) {
        case "faculty":
          return `/${shell.org}/faculty/notifications`
        case "student":
          return `/${shell.org}/student/notifications`
        case "admin":
        default:
          return `/${shell.org}/admin/notifications`
      }
    case "shared":
      return "/shared/notifications"
    default:
      return "/notifications"
  }
}