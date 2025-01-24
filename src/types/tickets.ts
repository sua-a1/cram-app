import { Database, Json } from './supabase';

// Base types from database
export type DBTicket = Database['public']['Tables']['tickets']['Row'];
export type DBTicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
export type DBTicketTemplate = Database['public']['Tables']['ticket_message_templates']['Row'];

export type TicketStatus = 'open' | 'in-progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
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

// Base message interface
export interface TicketMessage extends Omit<DBTicketMessage, 'message_type'> {
  message_type: MessageType;
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
export interface TicketWithDetails extends Omit<Ticket, 'assigned_team' | 'assigned_employee'> {
  assigned_team: string | null;
  assigned_team_details?: {
    name: string;
  };
  assigned_employee: string | null;
  assigned_employee_details?: {
    display_name: string;
    role: string;
  };
  messages?: TicketMessage[];
  creator?: {
    display_name: string;
    role: string;
  };
}

// Create ticket input type
export interface CreateTicketInput {
  subject: string;
  description?: string;
  priority: TicketPriority;
  handling_org_id: string;
  assigned_team?: string;
  assigned_employee?: string;
}

// Update ticket input type
export interface UpdateTicketInput {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_team?: string;
  assigned_employee?: string;
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