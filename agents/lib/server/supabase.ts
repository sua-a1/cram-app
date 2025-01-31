import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')

// Service role client with full database access
export function createServiceClient() {
  return createClient(
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

// Create a default service client instance
export const supabase = createServiceClient()

// Helper to handle common database operations
export const db = {
  // Document operations
  documents: {
    async findRelevant(query: string, limit: number = 5) {
      const { data, error } = await supabase
        .from('document_embeddings')
        .select(`
          id,
          chunk_text,
          document_id,
          metadata,
          knowledge_documents (
            id,
            title,
            content
          )
        `)
        .limit(limit)
      if (error) throw error
      return data
    }
  },
  
  // Ticket operations
  tickets: {
    async get(id: string) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  }
} 