/** @jest-environment node */

import { NextRequest } from 'next/server'

import { POST } from './route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

type MockSupabaseClient = {
  auth: {
    signInWithPassword: jest.Mock
    signOut: jest.Mock
  }
  from: jest.Mock
}

describe('POST /api/auth/signin', () => {
  let mockSupabase: MockSupabaseClient
  const createClientMock = createClient as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    const single = jest.fn().mockResolvedValue({
      data: { user_type: 'student', role: null },
      error: null,
    })

    const eq = jest.fn().mockReturnValue({ single })
    const select = jest.fn().mockReturnValue({ eq })

    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn().mockReturnValue({ select }),
    }

    createClientMock.mockResolvedValue(mockSupabase)
  })

  it('returns 200 on successful sign in', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'student@harbor.edu',
        password: 'password123',
        expectedUserType: 'student',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.userType).toBe('student')
    expect(body.data.redirectPath).toBe('/student/dashboard')
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'student@harbor.edu',
      password: 'password123',
    })
  })

  it('returns 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_EMAIL')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns 401 for invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'student@harbor.edu',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('SIGNIN_FAILED')
  })

  it('returns 403 and revokes session on portal mismatch', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { user_type: 'recruiter', role: null },
      error: null,
    })
    const eq = jest.fn().mockReturnValue({ single })
    const select = jest.fn().mockReturnValue({ eq })
    mockSupabase.from.mockReturnValue({ select })

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'recruiter@company.com',
        password: 'password123',
        expectedUserType: 'student',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('PORTAL_MISMATCH')
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
  })
})
