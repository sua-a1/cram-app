import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Environment variable validation
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a browser client for client components
export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
} 