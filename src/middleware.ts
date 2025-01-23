import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import type { UserRole } from '@/types/auth'

// Define public routes that don't require authentication
const publicRoutes = new Set([
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/verify',
  '/org/org-auth/signin',
  '/org/org-auth/signup',
  '/org/org-auth/callback',
  '/org/org-auth/access',
  '/org/org-auth/register',
  '/org/org-auth/reset-password',
  '/org/org-auth/update-password',
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete(name)
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // Check if the path is public
  if (publicRoutes.has(request.nextUrl.pathname)) {
    return response
  }

  // If no session, redirect to appropriate sign-in
  if (!session) {
    const redirectPath = request.nextUrl.pathname.startsWith('/org/')
      ? '/org/org-auth/signin'
      : '/auth/signin'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Get user's profile for role-based access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('user_id', session.user.id)
    .single()

  // Check role-based access for protected routes
  const requiredRoles = protectedRoutes[request.nextUrl.pathname]
  if (requiredRoles && (!profile || !requiredRoles.includes(profile.role))) {
    // Redirect to appropriate sign-in if role doesn't match
    const redirectPath = request.nextUrl.pathname.startsWith('/org/')
      ? '/org/org-auth/signin'
      : '/auth/signin'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Special handling for org routes
  if (request.nextUrl.pathname.startsWith('/org/') && !request.nextUrl.pathname.startsWith('/org/org-auth/')) {
    // Must have org_id to access org routes (except auth routes)
    if (!profile?.org_id) {
      return NextResponse.redirect(new URL('/org/org-auth/access', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/org/:path*',
    '/auth/:path*',
    '/customer/:path*'
  ]
} 