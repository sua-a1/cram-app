import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import type { UserRole } from '@/types/auth'
import type { CookieOptions } from '@supabase/ssr'

// Define public routes that don't require authentication
const publicRoutes = new Set([
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/verify',
  '/org/org-auth/signin',
  '/org/org-auth/signup',
  '/org/org-auth/callback',
  '/org/org-auth/access',
  '/org/org-auth/reset-password',
  '/org/org-auth/verify'
])

// Define routes that require specific roles
const protectedRoutes: Record<string, UserRole[]> = {
  '/customer': ['customer'],
  '/customer/dashboard': ['customer'],
  '/org': ['admin', 'employee'],
  '/org/dashboard': ['admin', 'employee']
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client using middleware helper
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on the request
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie on the response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from the request
          request.cookies.delete(name)
          // Remove cookie from the response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  // Check if the path is public
  const path = new URL(request.url).pathname
  if (publicRoutes.has(path)) {
    return response
  }

  try {
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession()

    // If no session, redirect to sign in
  if (!session) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    // For protected routes, check role permissions
    const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
      path.startsWith(route)
    )

    if (protectedRoute) {
      const [_, allowedRoles] = protectedRoute

  // Get user profile for role check
      const { data: profile, error: profileError } = await supabase
    .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
    .single()

      if (profileError || !profile || !allowedRoles.includes(profile.role)) {
        // If user doesn't have required role, redirect to unauthorized
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to sign in
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 