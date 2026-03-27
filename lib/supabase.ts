import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isValidSupabaseConfig(): boolean {
  try {
    new URL(supabaseUrl)
    return supabaseAnonKey.length > 20
  } catch {
    return false
  }
}

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!isValidSupabaseConfig()) {
    // Return a mock client that won't crash but won't work either
    // This lets pages render with a "not configured" state
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return async () => ({
                data: { user: null, session: null, users: [] },
                error: { message: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
              })
            },
          })
        }
        if (prop === 'from') {
          return () => new Proxy({}, {
            get() {
              return (..._args: unknown[]) => new Proxy({}, {
                get() {
                  return (..._a: unknown[]) => new Proxy({}, {
                    get(_t, p) {
                      if (p === 'then') return undefined
                      return (..._b: unknown[]) => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
                    },
                  })
                },
              })
            },
          })
        }
        if (prop === 'channel' || prop === 'removeChannel') {
          return (..._args: unknown[]) => new Proxy({}, {
            get() {
              return (..._a: unknown[]) => new Proxy({}, { get() { return () => ({}) } })
            },
          })
        }
        if (prop === 'storage') {
          return new Proxy({}, {
            get() {
              return () => new Proxy({}, {
                get() {
                  return () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
                },
              })
            },
          })
        }
        return undefined
      },
    }
    return new Proxy({}, handler) as ReturnType<typeof createBrowserClient>
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return client
}
