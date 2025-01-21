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
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          org_id: string
          role: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          role: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          role?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          message_type: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          message_type: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string
          message_type?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          id: string
          subject: string
          description: string
          status: string
          priority: string
          user_id: string
          handling_org_id: string
          assigned_team_id: string | null
          assigned_employee_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject: string
          description: string
          status: string
          priority: string
          user_id: string
          handling_org_id: string
          assigned_team_id?: string | null
          assigned_employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: string
          description?: string
          status?: string
          priority?: string
          user_id?: string
          handling_org_id?: string
          assigned_team_id?: string | null
          assigned_employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_handling_org_id_fkey"
            columns: ["handling_org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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