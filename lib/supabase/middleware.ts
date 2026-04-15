import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/skills',
  '/resume-analyzer',
  '/career-insights',
  '/admin-dashboard',
  '/users',
  '/settings',
  '/shared',
  '/student',
  '/university',
  '/recruiter',
]

const authPages = ['/login', '/register']

type AuthRedirectContext = {
  userType: string | null
  role: string | null
  universityName?: string | null
  company?: string | null
}

function isDynamicOrgRoute(pathname: string): boolean {
  return /^\/[^\/]+\/(admin|faculty|student|dashboard|search|jobs|candidates)/.test(pathname)
}

function shouldCheckAuth(pathname: string): boolean {
  if (authPages.includes(pathname)) {
    return true
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    return true
  }

  return isDynamicOrgRoute(pathname)
}

function slugify(value: string, fallback: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') || fallback
}

function getSafeRedirectPath(request: NextRequest): string | null {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo')
  if (!redirectTo) {
    return null
  }

  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return null
  }

  if (authPages.some((page) => redirectTo.startsWith(page))) {
    return null
  }

  return redirectTo
}

function getOrgFromPath(path: string): string | null {
  const match = path.match(/^\/([^/]+)\/(admin|faculty|student|dashboard|search|jobs|candidates)/)
  return match?.[1] ?? null
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip auth if Supabase credentials are not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-project-url') {
    console.warn('⚠️  Supabase credentials not configured. Authentication is disabled.')
    console.warn('📝 Update .env.local with your Supabase URL and key to enable authentication.')
    return NextResponse.next({ request })
  }

  // Avoid auth network calls for routes that do not need gatekeeping.
  if (!shouldCheckAuth(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        // Add timeout to prevent hanging requests
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(5000), // Keep middleware responsive under network issues.
          }).catch((error) => {
            if (error.name === 'TimeoutError') {
              console.error('[Middleware] Supabase fetch timed out after 5s for URL:', url)
            } else {
              console.error('[Middleware] Supabase fetch error:', error.message)
            }
            throw error
          })
        },
      },
    }
  )

  // Middleware uses local session presence for low-latency route gating.
  // We avoid session.user directly to prevent unverified-user warnings.
  let isAuthenticated = false
  let authRedirectContext: AuthRedirectContext | null = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    isAuthenticated = Boolean(session)

    // Only verify user details when we need role-based auth-page redirects.
    if (isAuthenticated && authPages.includes(pathname)) {
      const { data: { user } } = await supabase.auth.getUser()
      const userMetadata = (user?.user_metadata as Record<string, any> | undefined) ?? null

      let userType: string | null = null
      let role: string | null = null

      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.warn('[Middleware] Failed to resolve profile for auth redirect:', profileError.message)
        } else {
          userType = profileData?.user_type ?? null
          role = profileData?.role ?? null
        }
      }

      authRedirectContext = {
        userType,
        role,
        universityName: typeof userMetadata?.university_name === 'string' ? userMetadata.university_name : null,
        company: typeof userMetadata?.company === 'string' ? userMetadata.company : null,
      }
    }
  } catch (error) {
    console.error('[Middleware] Failed to get session:', error instanceof Error ? error.message : 'Unknown error')
    // Continue unauthenticated on failure.
  }

  // Handle protected routes
  const protectedRouteResponse = handleProtectedRoutes(request, isAuthenticated)
  if (protectedRouteResponse) {
    return protectedRouteResponse
  }

  // Handle authentication page redirects
  const authPageRedirectResponse = handleAuthPageRedirects(
    request,
    isAuthenticated,
    authRedirectContext,
    supabaseResponse
  )
  if (authPageRedirectResponse) {
    return authPageRedirectResponse
  }

  return supabaseResponse
}

function handleProtectedRoutes(request: NextRequest, isAuthenticated: boolean) {
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isProtectedDynamicOrgRoute = isDynamicOrgRoute(pathname)

  if ((isProtectedRoute || isProtectedDynamicOrgRoute) && !isAuthenticated) {
    // Redirect to login if trying to access protected route without auth
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }
  return null
}

function handleAuthPageRedirects(
  request: NextRequest,
  isAuthenticated: boolean,
  authRedirectContext: AuthRedirectContext | null,
  supabaseResponse: NextResponse
) {
  const pathname = request.nextUrl.pathname

  if (authPages.includes(pathname) && isAuthenticated) {
    const url = request.nextUrl.clone()

    const safeRedirectPath = getSafeRedirectPath(request)
    if (safeRedirectPath) {
      url.pathname = safeRedirectPath
      url.search = ''
      return NextResponse.redirect(url)
    }

    const rawUserType = authRedirectContext?.userType ?? null
    const role = authRedirectContext?.role ?? null
    const userType = rawUserType === 'university' && role === 'faculty' ? 'faculty' : rawUserType

    if (!userType) {
      console.warn('User logged in but no user_type on profile, allowing access to auth page')
      return supabaseResponse
    }

    if (userType === 'university' || userType === 'faculty') {
      const redirectOrg = getOrgFromPath(request.nextUrl.searchParams.get('redirectTo') ?? '')
      const universitySlug = redirectOrg ?? slugify(String(authRedirectContext?.universityName ?? ''), 'university')

      if (userType === 'faculty') {
        url.pathname = `/${universitySlug}/faculty/dashboard`
      } else {
        url.pathname = `/${universitySlug}/admin/dashboard`
      }
    } else if (userType === 'recruiter') {
      const redirectOrg = getOrgFromPath(request.nextUrl.searchParams.get('redirectTo') ?? '')
      const companySlug = redirectOrg ?? slugify(String(authRedirectContext?.company ?? ''), 'company')
      url.pathname = `/${companySlug}/dashboard`
    } else if (userType === 'student') {
      url.pathname = '/student/dashboard'
    } else {
      console.warn('Unknown user_type:', userType)
      return supabaseResponse
    }

    if (url.pathname === '/student/dashboard' && role === 'faculty') {
      const universitySlug = slugify(String(authRedirectContext?.universityName ?? ''), 'university')
      url.pathname = `/${universitySlug}/faculty/dashboard`
    }

    return NextResponse.redirect(url)
  }
  return null
}
