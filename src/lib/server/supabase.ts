import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database.types'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')

// Service role client with full database access
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

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