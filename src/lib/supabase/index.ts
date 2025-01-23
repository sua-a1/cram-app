import { createBrowserClient as createSupabaseBrowser, createServerClient as createSupabaseServer, serializeCookieHeader } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import type { CookieStore } from '@/types/cookies'
import type { Database } from '@/types/database.types'
import type { CookieMethods } from '@/types/cookies'
import type { NextApiRequest, NextApiResponse } from 'next'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Environment variable validation
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
if (!supabaseServiceKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create a server client for API routes
export function createRouteHandlerClient(request: Request) {
  const cookieStore = cookies()
  
  return createSupabaseServer<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

// Create a server client (for Server Components, Server Actions)
export function createServerClient() {
  const cookieStore = cookies()
  
  return createSupabaseServer<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

// Create a service role client for admin operations
export function createServiceClient() {
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-supabase-auth-bypass-rls': 'true'
        }
      }
    }
  )
}

// Create a browser client for client components
export function createBrowserClient() {
  return createSupabaseBrowser<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// Helper to get PKCE code verifier and challenge
export async function generatePKCE() {
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const base64Url = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return { codeVerifier, codeChallenge: base64Url }
} 