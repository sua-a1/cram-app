export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string
          role: string
          org_id: string | null
          department: string | null
          position: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          role?: string
          org_id?: string | null
          department?: string | null
          position?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string
          role?: string
          org_id?: string | null
          department?: string | null
          position?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          id: string
          subject: string
          description: string | null
          status: string
          priority: string
          user_id: string
          assigned_team: string | null
          assigned_employee: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject: string
          description?: string | null
          status?: string
          priority?: string
          user_id: string
          assigned_team?: string | null
          assigned_employee?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: string
          description?: string | null
          status?: string
          priority?: string
          user_id?: string
          assigned_team?: string | null
          assigned_employee?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_employee_fkey"
            columns: ["assigned_employee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_assigned_team_fkey"
            columns: ["assigned_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          org_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          org_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          content: string
          author_id: string
          is_internal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          content: string
          author_id: string
          is_internal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          content?: string
          author_id?: string
          is_internal?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 