import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import type { UserRole } from '@/types/auth'

// Define protected routes and their allowed roles
const protectedRoutes: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'employee', 'customer'],
  '/tickets': ['admin', 'employee', 'customer'],
  '/admin': ['admin'],
  '/employee': ['admin', 'employee'],
  '/knowledge-base/manage': ['admin'],
}

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    
    // Create supabase client with cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            res.cookies.delete(name)
          },
        },
      }
    )
    
    // Refresh session if expired
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error in middleware:', sessionError)
      const returnUrl = encodeURIComponent(req.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/signin?returnUrl=${returnUrl}`, req.url))
    }

    // Check if route requires protection
    const path = req.nextUrl.pathname
    const routeRoles = Object.entries(protectedRoutes).find(([route]) => 
      path.startsWith(route)
    )?.[1]

    if (!routeRoles) {
      return res
    }

    if (!session) {
      console.log('No session found for protected route:', path)
      const returnUrl = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/signin?returnUrl=${returnUrl}`, req.url))
    }

    // Get user role from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user role:', profileError)
      return NextResponse.redirect(new URL('/error', req.url))
    }

    const userRole = profile?.role as UserRole

    if (!routeRoles.includes(userRole)) {
      console.log(`User with role ${userRole} attempted to access ${path}`)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return res
  } catch (error) {
    console.error('Unexpected error in middleware:', error)
    return NextResponse.redirect(new URL('/error', req.url))
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/admin/:path*',
    '/employee/:path*',
    '/knowledge-base/manage/:path*',
  ],
} 