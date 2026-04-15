import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  return origin === request.nextUrl.origin
}

function unauthorizedResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AUTH_REQUEST_REJECTED',
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

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    console.warn('[AUTH] Sign out blocked due to origin mismatch')
    return unauthorizedResponse('Invalid request origin.', 403)
  }

  const cookieStore = await cookies()

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      console.error('[AUTH] Supabase global sign out failed:', error.message)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SIGNOUT_FAILED',
            message: 'Unable to sign out. Please try again.',
          },
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    const allCookies = cookieStore.getAll()
    const response = NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )

    for (const cookie of allCookies) {
      if (!cookie.name.startsWith('sb-')) {
        continue
      }

      cookieStore.delete(cookie.name)
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      })
    }

    console.info('[AUTH] Sign out completed')
    return response
  } catch (error) {
    console.error('[AUTH] Unexpected sign out error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SIGNOUT_FAILED',
          message: 'Unable to sign out due to a server error.',
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
