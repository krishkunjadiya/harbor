import { shouldBypassAuthPageRedirect } from './auth-redirect'

describe('shouldBypassAuthPageRedirect', () => {
  it('returns true for login route with loggedOut marker', () => {
    const searchParams = new URLSearchParams('loggedOut=1')

    expect(shouldBypassAuthPageRedirect('/login', searchParams)).toBe(true)
  })

  it('returns false when loggedOut marker is missing', () => {
    const searchParams = new URLSearchParams('redirectTo=/student/dashboard')

    expect(shouldBypassAuthPageRedirect('/login', searchParams)).toBe(false)
  })

  it('returns false for non-login routes even with loggedOut marker', () => {
    const searchParams = new URLSearchParams('loggedOut=1')

    expect(shouldBypassAuthPageRedirect('/student/dashboard', searchParams)).toBe(false)
  })
})
