import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/auth/callback', '/admin/login']
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  )
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const hasLocalAdminSession = request.cookies.has('admin_session')

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
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  // Allow local admin session to bypass Supabase auth for admin routes
  if (!user && isAdminRoute && hasLocalAdminSession) {
    // If they are on the login page (or trying to reach it), redirect to dashboard
    if (request.nextUrl.pathname === '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // If user is not signed in and the route is not public, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = isAdminRoute ? '/admin/login' : '/login'
    return NextResponse.redirect(url)
  }

  // If user is signed in and trying to access login/register, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is signed in and trying to access admin login, redirect to admin dashboard
  if (user && request.nextUrl.pathname === '/admin/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
