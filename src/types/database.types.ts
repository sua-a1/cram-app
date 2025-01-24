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
export type NotificationType = 'status_update' | 'new_message'

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
          subject: string
          description: string | null
          status: string
          priority: string
          user_id: string
          handling_org_id: string
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
          handling_org_id: string
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
            foreignKeyName: "tickets_handling_org_id_fkey"
            columns: ["handling_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          body: string
          message_type: string
          created_at: string
          updated_at: string
          is_email: boolean | null
          metadata: Json | null
          template_id: string | null
          parent_message_id: string | null
          source: string
          external_id: string | null
          author_role: string
          author_name: string | null
          author_email: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          body: string
          message_type?: string
          created_at?: string
          updated_at?: string
          is_email?: boolean | null
          metadata?: Json | null
          template_id?: string | null
          parent_message_id?: string | null
          source?: string
          external_id?: string | null
          author_role?: string
          author_name?: string | null
          author_email?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string
          body?: string
          message_type?: string
          created_at?: string
          updated_at?: string
          is_email?: boolean | null
          metadata?: Json | null
          template_id?: string | null
          parent_message_id?: string | null
          source?: string
          external_id?: string | null
          author_role?: string
          author_name?: string | null
          author_email?: string | null
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
          },
          {
            foreignKeyName: "ticket_messages_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "ticket_message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_message_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          content: string
          category: string | null
          is_shared: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          content: string
          category?: string | null
          is_shared?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          content?: string
          category?: string | null
          is_shared?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_message_templates_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_message_templates_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      notifications: {
        Row: {
          id: string
          user_id: string
          ticket_id: string
          type: NotificationType
          message: string
          read: boolean
          message_id: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          ticket_id: string
          type: NotificationType
          message: string
          read?: boolean
          message_id?: string | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          ticket_id?: string
          type?: NotificationType
          message?: string
          read?: boolean
          message_id?: string | null
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "ticket_messages"
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
      notification_type: NotificationType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 