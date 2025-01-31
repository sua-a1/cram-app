export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversation_embeddings: {
        Row: {
          context_window: string | null
          created_at: string | null
          embedding: string | null
          id: string
          message_id: string | null
          ticket_id: string | null
        }
        Insert: {
          context_window?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          message_id?: string | null
          ticket_id?: string | null
        }
      }
      document_embeddings: {
        Row: {
          chunk_index: number | null
          chunk_text: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          chunk_index?: number | null
          chunk_text?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
      }
    }
  }
} 