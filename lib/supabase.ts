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

let mockClient: any = null
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!isValidSupabaseConfig()) {
    if (mockClient) return mockClient
    
    // Return a mock client that won't crash but won't work either
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return async () => ({
                data: { user: null, session: null, users: [] },
                error: { message: 'Supabase is not configured' },
              })
            },
          })
        }
        return () => new Proxy({}, { get() { return () => ({}) } })
      },
    }
    mockClient = new Proxy({}, handler)
    return mockClient as ReturnType<typeof createBrowserClient>
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' 
          ? {
              getItem: (key: string) => localStorage.getItem(key),
              setItem: (key: string, value: string) => localStorage.setItem(key, value),
              removeItem: (key: string) => localStorage.removeItem(key),
            }
          : undefined
      },
    })
  }
  return client
}
