import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase'

// Server-side Supabase client with full access
// Only use this in server components or API routes
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Create a Supabase client with the service role key
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-supabase-auth-bypass-rls': 'true'
        }
      }
    }
  )
}

// Create a server component client that handles cookies
export async function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  })
}

// Export both for convenience
export { createClient }

// Helper to handle common database operations
export const db = {
  // Ticket operations will be implemented here
  tickets: {
    // Implementation will follow after Supabase project setup
  },
  
  // User operations
  users: {
    // Implementation will follow after Supabase project setup
  },
  
  // Team operations
  teams: {
    // Implementation will follow after Supabase project setup
  }
} 