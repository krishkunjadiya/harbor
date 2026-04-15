"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AUTH_SYNC_KEY = 'harbor:auth:event'
const AUTH_LOGOUT_MARKER_KEY = 'harbor:auth:logout-marker'
const LOGOUT_REDIRECT_PATH = '/login?loggedOut=1'

type AuthApiError = {
  success: false
  error?: {
    code?: string
    message?: string
  }
}

type SignInApiSuccess = {
  success: true
  data: {
    userType: string
    redirectPath: string
  }
}

type AuthContextType = {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null; user?: User | null }>
  signIn: (email: string, password: string, expectedUserType?: string) => Promise<{ error: AuthError | null; user?: User | null; userType?: string | null; redirectPath?: string | null }>
  signOut: () => Promise<void>
  loading: boolean
  getUserType: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const manualSignOutInProgressRef = useRef(false)
  const router = useRouter()
  
  // Check if Supabase is configured
  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-project-url'

  const supabase = isSupabaseConfigured ? createClient() : null

  const broadcastSignedOut = useCallback(() => {
    try {
      localStorage.setItem(
        AUTH_SYNC_KEY,
        JSON.stringify({ type: 'SIGNED_OUT', at: Date.now() })
      )
    } catch (error) {
      console.warn('[AUTH] Unable to sync sign out via localStorage:', error)
    }

    try {
      sessionStorage.setItem(AUTH_LOGOUT_MARKER_KEY, String(Date.now()))
    } catch (error) {
      console.warn('[AUTH] Unable to set logout marker:', error)
    }
  }, [])

  const redirectToLoggedOutPage = useCallback(() => {
    router.replace(LOGOUT_REDIRECT_PATH)
    router.refresh()

    // Keep a hard navigation fallback in case client routing is blocked by pending UI state.
    window.setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.replace(LOGOUT_REDIRECT_PATH)
      }
    }, 120)
  }, [router])

  const syncVerifiedUser = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      return
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      setUser(null)
      return
    }
    setUser(user ?? null)
  }, [supabase])

  const isProtectedPath = (pathname: string) => {
    const protectedPrefixes = [
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

    if (protectedPrefixes.some((route) => pathname.startsWith(route))) {
      return true
    }

    return /^\/[^\/]+\/(admin|faculty|student|dashboard|search|jobs|candidates)/.test(pathname)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️  Supabase not configured. Authentication is disabled.')
      setLoading(false)
      return
    }

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to get session:', error.message)
        }
        setSession(session)
        await syncVerifiedUser()
      } catch (error) {
        console.error('Network error getting session:', error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      await syncVerifiedUser()

      if (event === 'SIGNED_OUT' && typeof window !== 'undefined' && isProtectedPath(window.location.pathname)) {
        if (manualSignOutInProgressRef.current) {
          return
        }

        // Use a hard redirect for logout to ensure clean state and avoid client-side routing stalls.
        window.location.replace(LOGOUT_REDIRECT_PATH)
      }
    })

    return () => subscription.unsubscribe()
  }, [isSupabaseConfigured, supabase, syncVerifiedUser])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_SYNC_KEY || !event.newValue) {
        return
      }

      try {
        const parsed = JSON.parse(event.newValue) as { type?: string }
        if (parsed.type !== 'SIGNED_OUT') {
          return
        }
      } catch {
        return
      }

      setSession(null)
      setUser(null)

      try {
        sessionStorage.setItem(AUTH_LOGOUT_MARKER_KEY, String(Date.now()))
      } catch {
        // Ignore storage write failures and continue redirect.
      }

      window.location.replace(LOGOUT_REDIRECT_PATH)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase) {
      return { error: { message: 'Authentication not configured. Please set up Supabase credentials.' } as AuthError }
    }

    if (metadata?.user_type === 'student') {
      return {
        error: {
          message: 'Student self-registration is disabled. Student accounts must be created by a university administrator.',
          name: 'Forbidden',
          status: 403,
        } as AuthError,
      }
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      return { error, user: data?.user }
    } catch (error) {
      console.error('Sign up network error:', error)
      return { 
        error: { 
          message: 'Network error. Please check your internet connection and try again.',
          name: 'NetworkError',
          status: 0
        } as AuthError 
      }
    }
  }

  const signIn = async (email: string, password: string, expectedUserType?: string) => {
    if (!supabase) {
      return { error: { message: 'Authentication not configured. Please set up Supabase credentials.' } as AuthError }
    }

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          email,
          password,
          expectedUserType,
        }),
      })

      const payload = (await response.json().catch(() => null)) as AuthApiError | SignInApiSuccess | null

      if (!response.ok || !payload || payload.success !== true) {
        const message = payload && payload.success === false
          ? payload.error?.message || 'Unable to sign in. Please try again.'
          : 'Unable to sign in. Please try again.'

        return {
          error: {
            message,
            name: 'AuthApiError',
            status: response.status,
          } as AuthError,
          user: null,
          userType: null,
          redirectPath: null,
        }
      }

      const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ])

      setUser(userData.user ?? null)
      setSession(sessionData.session ?? null)

      return {
        error: null,
        user: userData.user,
        userType: payload.data.userType,
        redirectPath: payload.data.redirectPath,
      }
    } catch (error) {
      console.error('[AUTH] Sign in request failed:', error)
      return {
        error: {
          message: 'Network error. Please check your internet connection and try again.',
          name: 'NetworkError',
          status: 0
        } as AuthError,
        user: null,
        userType: null,
        redirectPath: null,
      }
    }
  }

  const getUserType = () => {
    // This will be fetched from profiles table when needed
    // For now, return from user_metadata if available, otherwise null
    if (!user?.user_metadata) return null
    return user.user_metadata.user_type || null
  }

  const signOut = async () => {
    if (manualSignOutInProgressRef.current) {
      return
    }

    manualSignOutInProgressRef.current = true

    // 1. Clear local state immediately so UI updates.
    setSession(null)
    setUser(null)

    // 2. Broadcast logout to other tabs first.
    broadcastSignedOut()

    // 3. Try best-effort local SDK signout to drop in-memory auth state.
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // We still continue with server signout and redirect.
      }
    }

    // 4. Attempt server cookie/session revocation before redirecting to login.
    try {
      const abortController = new AbortController()
      const timeoutId = window.setTimeout(() => abortController.abort(), 1200)

      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
      } finally {
        window.clearTimeout(timeoutId)
      }
    } catch {
      // Redirect regardless so the user is not blocked on network failures.
    } finally {
      // 5. Redirect to login with a signed-out marker to avoid middleware race conditions.
      redirectToLoggedOutPage()

      // If navigation is interrupted, allow retry attempts in the same tab.
      window.setTimeout(() => {
        manualSignOutInProgressRef.current = false
      }, 2000)
    }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    getUserType,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
