export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'admin' | 'employee' | 'customer'
export type TicketStatus = 'open' | 'in-progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type MessageType = 'public' | 'internal'
export type OrganizationStatus = 'active' | 'inactive' | 'pending'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string | null
          status: OrganizationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          status?: OrganizationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          status?: OrganizationStatus
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string
          role: UserRole
          org_id: string | null
          department: string | null
          position: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          role: UserRole
          org_id?: string | null
          department?: string | null
          position?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string
          role?: UserRole
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
      tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          description: string | null
          status: TicketStatus
          priority: TicketPriority
          handling_org_id: string
          assigned_team: string | null
          assigned_employee: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          description?: string | null
          status?: TicketStatus
          priority?: TicketPriority
          handling_org_id: string
          assigned_team?: string | null
          assigned_employee?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          description?: string | null
          status?: TicketStatus
          priority?: TicketPriority
          handling_org_id?: string
          assigned_team?: string | null
          assigned_employee?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_employee_fkey"
            columns: ["assigned_employee"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_assigned_team_fkey"
            columns: ["assigned_team"]
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          message_type: MessageType
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          message_type?: MessageType
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string
          message_type?: MessageType
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_articles: {
        Row: {
          id: string
          title: string
          content: string
          org_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
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
      user_role: UserRole
      ticket_status: TicketStatus
      ticket_priority: TicketPriority
      message_type: MessageType
      organization_status: OrganizationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 