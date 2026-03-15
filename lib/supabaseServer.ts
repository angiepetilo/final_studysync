import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export function createServerSupabaseClient() {
  if (!isValidSupabaseConfig()) {
    // Return a mock server client that allows pages to render
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return async () => ({
                data: { user: null, session: null },
                error: { message: 'Supabase is not configured' },
              })
            },
          })
        }
        if (prop === 'from') {
          return () => new Proxy({}, {
            get() {
              return (..._args: unknown[]) => new Proxy({}, {
                get(_t: object, p: string) {
                  if (p === 'then') return undefined
                  return (..._a: unknown[]) => Promise.resolve({ data: null, count: 0, error: { message: 'Supabase not configured' } })
                },
              })
            },
          })
        }
        return undefined
      },
    }
    return new Proxy({}, handler) as ReturnType<typeof createServerClient>
  }

  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
