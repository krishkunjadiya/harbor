import { randomUUID } from 'node:crypto'

export function getRequestId(input: { headers: Headers }): string {
  const existing = input.headers.get('x-request-id') ?? input.headers.get('x-correlation-id')
  return existing && existing.trim() ? existing.trim() : randomUUID()
}
