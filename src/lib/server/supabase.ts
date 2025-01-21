import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/supabase'

// Server-side Supabase client with full access
// Only use this in server components or API routes
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

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