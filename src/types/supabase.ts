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
      profiles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'employee' | 'user'
          name: string | null
          email: string
          created_at: string
          updated_at: string
          team_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>>
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['teams']['Row'], 'id'>>
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          description: string | null
          status: 'open' | 'in-progress' | 'closed'
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
          assigned_team: string | null
          assigned_employee: string | null
        }
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['tickets']['Row'], 'id'>>
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          content: string
          type: 'message' | 'note' | 'status_change'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ticket_messages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['ticket_messages']['Row'], 'id'>>
      }
      knowledge_articles: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          author_id: string
          created_at: string
          updated_at: string
          published: boolean
        }
        Insert: Omit<Database['public']['Tables']['knowledge_articles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['knowledge_articles']['Row'], 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 