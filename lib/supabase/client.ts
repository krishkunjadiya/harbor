import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials')
    throw new Error(
      'Missing Supabase credentials. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
    )
  }

  console.log('[Supabase] Initializing client with URL:', supabaseUrl)

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'harbor-app',
      },
      // Add timeout to prevent hanging requests (30s for paused instances to wake)
      fetch: (url, options = {}) => {
        console.log('[Supabase] Fetching:', url)
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30 second timeout for paused instances
        }).catch((error) => {
          console.error('[Supabase] Fetch failed:', {
            url,
            error: error.message,
            name: error.name,
            cause: error.cause
          })
          
          if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            throw new Error('Connection timeout')
          }
          
          if (error.message === 'Failed to fetch') {
            throw new Error('Failed to connect')
          }
          
          throw error
        })
      },
    },
  })
}
