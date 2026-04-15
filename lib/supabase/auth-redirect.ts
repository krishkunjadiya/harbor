export function shouldBypassAuthPageRedirect(pathname: string, searchParams: URLSearchParams): boolean {
  return pathname === '/login' && searchParams.get('loggedOut') === '1'
}