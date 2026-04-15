import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export type ResumeSsoClaims = {
  iss: 'harbor'
  aud: 'reactive_resume'
  ver: 1 | 2
  sub: string
  email: string
  name: string
  role: string
  jti: string
  iat: number
  exp: number
}

const TOKEN_CLOCK_SKEW_SECONDS = 300

type Header = {
  alg: 'HS256'
  typ: 'JWT'
}

const HEADER: Header = { alg: 'HS256', typ: 'JWT' }

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export function createResumeSsoToken(input: {
  userId: string
  email: string
  name: string
  role: string
  ttlSeconds: number
  secret: string
  version?: 1 | 2
}): { token: string; claims: ResumeSsoClaims } {
  const now = Math.floor(Date.now() / 1000)
  const tokenVersion = input.version ?? 1

  const claims: ResumeSsoClaims = {
    iss: 'harbor',
    aud: 'reactive_resume',
    ver: tokenVersion,
    sub: input.userId,
    email: input.email,
    name: input.name,
    role: input.role,
    jti: randomUUID(),
    iat: now,
    exp: now + input.ttlSeconds,
  }

  const encodedHeader = toBase64Url(JSON.stringify(HEADER))
  const encodedPayload = toBase64Url(JSON.stringify(claims))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = sign(signingInput, input.secret)

  return { token: `${signingInput}.${signature}`, claims }
}

export function verifyResumeSsoToken(token: string, secret: string): ResumeSsoClaims {
  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = sign(signingInput, secret)

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error('Invalid token signature')
  }

  let header: Header
  let payload: ResumeSsoClaims

  try {
    header = JSON.parse(fromBase64Url(encodedHeader)) as Header
    payload = JSON.parse(fromBase64Url(encodedPayload)) as ResumeSsoClaims
  } catch {
    throw new Error('Invalid token encoding')
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Unsupported token header')
  }

  if (payload.iss !== 'harbor' || payload.aud !== 'reactive_resume') {
    throw new Error('Invalid token claims')
  }

  if (payload.ver !== 1 && payload.ver !== 2) {
    throw new Error('Unsupported token version')
  }

  const now = Math.floor(Date.now() / 1000)

  if (!Number.isFinite(payload.exp) || now > payload.exp + TOKEN_CLOCK_SKEW_SECONDS) {
    throw new Error('Token expired')
  }

  if (!payload.sub || !payload.email || !payload.jti) {
    throw new Error('Incomplete token claims')
  }

  return payload
}
