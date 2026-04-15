/** @jest-environment node */

import { NextRequest } from 'next/server'

import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('POST /api/auth/signout', () => {
  const createClientMock = createClient as jest.Mock
  const cookiesMock = cookies as jest.Mock

  const cookieStore = {
    getAll: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    cookiesMock.mockResolvedValue(cookieStore)
    cookieStore.getAll.mockReturnValue([
      { name: 'sb-project-auth-token', value: 'abc' },
      { name: 'other-cookie', value: '123' },
    ])
  })

  it('returns 403 when request origin is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signout', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example.com',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('AUTH_REQUEST_REJECTED')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns 500 when Supabase sign out fails', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signOut: jest.fn().mockResolvedValue({
          error: { message: 'Failed to revoke session' },
        }),
      },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signout', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('SIGNOUT_FAILED')
  })

  it('returns 200 and clears Supabase cookies on successful sign out', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({
      auth: {
        signOut,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/signout', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(cookieStore.delete).toHaveBeenCalledWith('sb-project-auth-token')
    expect(cookieStore.delete).not.toHaveBeenCalledWith('other-cookie')
  })
})
