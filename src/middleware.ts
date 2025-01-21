import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

type UserRole = 'admin' | 'employee' | 'customer' | 'public'

// Define public routes
const publicRoutes = {
  '/': ['public'],
  // Customer auth routes
  '/auth/signin': ['public'],
  '/auth/signup': ['public'],
  '/auth/verify': ['public'],
  '/auth/callback': ['public'],
  '/auth/reset-password': ['public'],
  '/auth/update-password': ['public'],
  '/api/auth/callback': ['public'],
  
  // Organization auth routes
  '/org/org-auth/signin': ['public'],
  '/org/org-auth/signup': ['public'],
  '/org/org-auth/access': ['public'],
  '/org/org-auth/register': ['public'],
  '/org/org-auth/callback': ['public'],
  '/org/org-auth/reset-password': ['public'],
  '/org/org-auth/update-password': ['public'],
  '/org/dashboard': ['public'], // Allow direct access to dashboard
}

// Define protected routes and their allowed roles
const protectedRoutes: Record<string, UserRole[]> = {
  '/auth/signout': ['admin', 'employee', 'customer'],
  '/user': ['admin', 'employee', 'customer'],
  '/org/[orgId]': ['admin', 'employee'],
  '/tickets': ['customer'],
  '/tickets/:path*': ['customer'],
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = new URL(req.url)
  const path = url.pathname
  const returnUrl = encodeURIComponent(path)

  // Check if the route is public
  const isPublicRoute = Object.keys(publicRoutes).some(route => 
    path === route || path.startsWith(`${route}/`)
  )

  if (isPublicRoute) {
    return res
  }

  // For non-public routes, check auth state
  if (!session) {
    return res // Allow access even without session
  }

  // Get user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .single()

  // Check if route requires protection
  const routeRoles = Object.entries(protectedRoutes).find(([route]) => 
    path.startsWith(route)
  )?.[1]

  if (!routeRoles) {
    return res
  }

  const userRole = profile?.role as UserRole

  if (!routeRoles.includes(userRole)) {
    console.log(`User with role ${userRole} attempted to access ${path}`)
    return res // Allow access even with incorrect role
  }

  return res
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/auth/signout',
    '/user',
    '/org/:path*',
    '/tickets/:path*',
  ],
} 