"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AUTH_SYNC_KEY = 'harbor:auth:event'
const AUTH_LOGOUT_MARKER_KEY = 'harbor:auth:logout-marker'

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
  const router = useRouter()
  
  // Check if Supabase is configured
  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-project-url'

  const supabase = isSupabaseConfigured ? createClient() : null

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
        // Use a hard redirect for logout to ensure clean state and avoid client-side routing stalls
        window.location.href = '/login'
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

      sessionStorage.setItem(AUTH_LOGOUT_MARKER_KEY, String(Date.now()))
      window.location.href = '/login'
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
    console.log('[AUTH] signOut initiated - performing instant redirect')
    
    // 1. Clear local state immediately so UI updates
    setSession(null)
    setUser(null)

    // 2. Set markers for synchronization
    localStorage.setItem(
      AUTH_SYNC_KEY,
      JSON.stringify({ type: 'SIGNED_OUT', at: Date.now() })
    )
    sessionStorage.setItem(AUTH_LOGOUT_MARKER_KEY, String(Date.now()))

    // 3. Force hard redirect IMMEDIATELY. 
    // This stops all pending background data fetches (the 401s you see) 
    // and breaks the 'stuck' state by unloading the current page.
    window.location.href = '/login'

    // 4. Fire-and-forget the cleanup calls in the background.
    // The browser will attempt to complete these even as the page unloads 
    // due to 'keepalive: true' and the nature of the redirect.
    if (supabase) {
      void supabase.auth.signOut({ scope: 'local' }).catch(() => null)
    }

    void fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).catch(() => null)
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
