import type { Database } from './database.types'
import { Json } from './supabase';
import type { Profile } from '@/types/profiles';
import type { Team } from '@/types/teams';
import type { Organization } from '@/types/organizations';

// Base types from database
export type DBTicket = Database['public']['Tables']['tickets']['Row'];
export type DBTicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: string;
  author_name: string | null;
  author_email: string | null;
  body: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  is_email: boolean | null;
  metadata: Json | null;
  template_id: string | null;
  parent_message_id: string | null;
  source: string;
  external_id: string | null;
};
export type DBTicketTemplate = Database['public']['Tables']['ticket_message_templates']['Row'];

export type TicketStatus = 'open' | 'in-progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type MessageType = 'public' | 'internal';

// Base ticket interface
export interface Ticket extends DBTicket {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  user_id: string;
  handling_org_id: string;
  assigned_team: string | null;
  assigned_employee: string | null;
  created_at: string;
  updated_at: string;
}

// Message interface
export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: 'customer' | 'employee' | 'admin';
  author_name: string | null;
  author_email: string | null;
  body: string;
  message_type: MessageType;
  created_at: string;
  updated_at: string;
  is_email: boolean | null;
  metadata: Json | null;
  template_id: string | null;
  parent_message_id: string | null;
  source: 'web' | 'email' | 'api';
  external_id: string | null;
  author?: {
    display_name: string;
    role: string;
  };
}

// Template interface
export interface TicketTemplate extends DBTicketTemplate {
  id: string;
  org_id: string;
  name: string;
  content: string;
  category: string | null;
  is_shared: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Extended ticket type with optional relations
export interface TicketWithDetails {
  id: string
  user_id: string
  subject: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  handling_org_id: string | null
  handling_org?: {
    id: string
    name: string
  } | null
  assigned_team: string | null
  assigned_team_details?: {
    id: string
    name: string
  } | null
  assigned_employee: string | null
  assigned_employee_details?: {
    user_id: string
    display_name: string
  } | null
  creator?: {
    display_name: string
    role: string
  }
  messages?: TicketMessage[]
  created_at: string
  updated_at: string
}

// Create ticket input type
export interface CreateTicketInput {
  subject: string
  description?: string
  priority: TicketPriority
  handling_org_id: string
  assigned_team?: string
  assigned_employee?: string
}

// Update ticket input type
export interface UpdateTicketInput {
  subject?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assigned_team?: string | null
  assigned_employee?: string | null
}

// Create message input type
export interface CreateTicketMessageInput {
  ticket_id: string;
  message_type: MessageType;
  body: string;
  is_email?: boolean;
  template_id?: string;
  parent_message_id?: string;
  metadata?: Json;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedTeam?: string;
  assignedEmployee?: string;
  search?: string;
}

export interface BulkTicketUpdate {
  ticketIds: string[];
  updates: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigned_team?: string | null;
    assigned_employee?: string | null;
  };
}

export interface BulkOperationResponse {
  success: boolean;
  updatedCount: number;
  errors?: string[];
}

export interface TicketMessageData {
  ticketId: string;
  body: string;
  messageType: MessageType;
  isEmail?: boolean;
  templateId?: string;
  parentMessageId?: string;
  metadata?: Json;
}

export interface TicketTemplateData {
  name: string;
  content: string;
  category?: string;
  isShared?: boolean;
}

// Utility type for ticket selection state
export type SelectedTickets = Record<string, boolean>;

export type InternalNote = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  author_role: 'employee' | 'admin';
  content: string;
  related_ticket_message_id?: string;
  created_at: string;
  updated_at: string;
  author?: Profile; // Join with profiles table for additional profile info
};

export type InternalNoteWithMessage = InternalNote & {
  related_message?: TicketMessage;
}; 