import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

type UserType = 'student' | 'university' | 'faculty' | 'recruiter'

type SignInRequestBody = {
  email?: string
  password?: string
  expectedUserType?: UserType
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORTED_USER_TYPES = new Set<UserType>(['student', 'university', 'faculty', 'recruiter'])

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  return origin === request.nextUrl.origin
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

function normalizeUserType(profileUserType: string | null | undefined, profileRole: string | null | undefined): UserType | null {
  if (profileUserType === 'university' && profileRole === 'faculty') {
    return 'faculty'
  }

  if (!profileUserType || !SUPPORTED_USER_TYPES.has(profileUserType as UserType)) {
    return null
  }

  return profileUserType as UserType
}

function resolveRedirectPath(userType: UserType): string {
  switch (userType) {
    case 'student':
      return '/student/dashboard'
    case 'faculty':
      return '/ppsu/faculty/dashboard'
    case 'university':
      return '/ppsu/admin/dashboard'
    case 'recruiter':
      return '/techcorp/dashboard'
    default:
      return '/dashboard'
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    console.warn('[AUTH] Sign in blocked due to origin mismatch')
    return errorResponse(403, 'AUTH_REQUEST_REJECTED', 'Invalid request origin.')
  }

  let body: SignInRequestBody

  try {
    body = (await request.json()) as SignInRequestBody
  } catch {
    return errorResponse(400, 'INVALID_PAYLOAD', 'Request payload must be valid JSON.')
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const expectedUserType = body.expectedUserType

  if (!email || !password) {
    return errorResponse(400, 'MISSING_CREDENTIALS', 'Email and password are required.')
  }

  if (!EMAIL_REGEX.test(email)) {
    return errorResponse(400, 'INVALID_EMAIL', 'A valid email address is required.')
  }

  if (password.length < 8) {
    return errorResponse(400, 'INVALID_PASSWORD', 'Password must be at least 8 characters long.')
  }

  if (expectedUserType && !SUPPORTED_USER_TYPES.has(expectedUserType)) {
    return errorResponse(400, 'INVALID_USER_TYPE', 'Invalid user type provided.')
  }

  try {
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      const isInvalidCredentials = authError?.message.includes('Invalid login credentials')
      const message = isInvalidCredentials
        ? 'Invalid email or password. Please try again.'
        : authError?.message || 'Unable to sign in.'

      console.warn('[AUTH] Sign in failed', {
        reason: authError?.message || 'Unknown error',
      })

      return errorResponse(isInvalidCredentials ? 401 : 400, 'SIGNIN_FAILED', message)
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('[AUTH] Sign in profile lookup failed:', profileError.message)
      await supabase.auth.signOut({ scope: 'global' })
      return errorResponse(500, 'PROFILE_LOOKUP_FAILED', 'Failed to load user profile.')
    }

    const userType = normalizeUserType(profileData?.user_type, profileData?.role)

    if (!userType) {
      console.warn('[AUTH] User has unsupported profile type')
      await supabase.auth.signOut({ scope: 'global' })
      return errorResponse(403, 'UNSUPPORTED_USER_TYPE', 'This account type is not supported.')
    }

    if (expectedUserType && expectedUserType !== userType && !(expectedUserType === 'university' && userType === 'faculty')) {
      console.warn('[AUTH] Portal mismatch during sign in', {
        expectedUserType,
        actualUserType: userType,
      })
      await supabase.auth.signOut({ scope: 'global' })
      return errorResponse(403, 'PORTAL_MISMATCH', `This account is registered as a ${userType}. Please use the correct login tab.`)
    }

    console.info('[AUTH] Sign in completed', { userType })

    return NextResponse.json(
      {
        success: true,
        data: {
          userType,
          redirectPath: resolveRedirectPath(userType),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[AUTH] Unexpected sign in error:', error instanceof Error ? error.message : 'Unknown error')
    return errorResponse(500, 'SIGNIN_FAILED', 'Unable to sign in due to a server error.')
  }
}
