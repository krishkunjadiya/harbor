"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null; user?: User | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; user?: User | null; userType?: string | null }>
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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️  Supabase not configured. Authentication is disabled.')
      setLoading(false)
      return
    }

    const syncVerifiedUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        setUser(null)
        return
      }
      setUser(user ?? null)
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      await syncVerifiedUser()
    })

    return () => subscription.unsubscribe()
  }, [isSupabaseConfigured, supabase])

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

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Authentication not configured. Please set up Supabase credentials.' } as AuthError }
    }
    
    try {
      console.log('[AUTH] Signing in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.log('[AUTH] Sign in failed:', error.message)
        return { error, user: null, userType: null }
      }
      
      console.log('[AUTH] Sign in successful, fetching profile for user:', data.user.id)
      // Fetch user_type and role from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, role')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('[AUTH] Error fetching user profile:', profileError)
        return { 
          error: { 
            message: 'Failed to load user profile. Please try again.',
            name: 'ProfileError',
            status: 500
          } as AuthError,
          user: null,
          userType: null
        }
      }
      
      // Determine effective user type based on role for university users
      let effectiveUserType = profileData?.user_type
      if (profileData?.user_type === 'university' && profileData?.role === 'faculty') {
        effectiveUserType = 'faculty'
      }
      
      console.log('[AUTH] Profile fetched, user_type:', profileData?.user_type, 'role:', profileData?.role, 'effective:', effectiveUserType)
      return { error: null, user: data?.user, userType: effectiveUserType }
    } catch (error) {
      console.error('[AUTH] Sign in network error:', error)
      return { 
        error: { 
          message: 'Network error. Please check your internet connection and try again.',
          name: 'NetworkError',
          status: 0
        } as AuthError,
        user: null,
        userType: null
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
    if (!supabase) {
      router.push('/landing')
      return
    }
    
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      // Continue with redirect even if signout fails
    }
    router.push('/landing')
    router.refresh()
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
