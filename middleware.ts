import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/auth/callback', '/admin/login']
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  )
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')
  const hasLocalAdminSession = request.cookies.has('admin_session')
  
  // LOGGING - helpful for debugging redirects
  // console.log(`Middleware: ${request.nextUrl.pathname} | user: ${!!user} | public: ${isPublicRoute} | admin: ${isAdminRoute}`)

  // If Supabase is not configured, allow public routes and block private ones
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase') || supabaseKey.includes('your-supabase')) {
    // Allow public routes and all admin routes (admin pages handle their own auth via localStorage)
    if (isPublicRoute || isAdminRoute) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow local admin session to bypass Supabase auth for admin routes
  if (!user && isAdminRoute && hasLocalAdminSession) {
    return NextResponse.next()
  }

  // If user is not signed in and the route is not public, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    // Avoid infinite redirect if already on login pages
    if (url.pathname !== '/admin/login' && url.pathname !== '/login') {
      url.pathname = isAdminRoute ? '/admin/login' : '/login'
      return NextResponse.redirect(url)
    }
  }

  // If user is signed in and trying to access landing/login/register, redirect to dashboard
  if (user && isPublicRoute && !isAdminRoute && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*', 
    '/dashboard', 
    '/admin',
    '/login',
    '/register',
    '/verify-email'
  ],
}
