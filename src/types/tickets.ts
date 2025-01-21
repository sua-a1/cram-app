export type TicketStatus = 'open' | 'in-progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type MessageType = 'public' | 'internal'

// Base ticket interface
export interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  user_id: string
  handling_org_id: string
  assigned_team: string | null
  assigned_employee: string | null
  created_at: string
  updated_at: string
}

// Base message interface
export interface TicketMessage {
  id: string
  ticket_id: string
  author_id: string
  message_type: MessageType
  body: string
  created_at: string
  updated_at: string
}

// Extended ticket type with optional relations
export interface TicketWithDetails extends Omit<Ticket, 'assigned_team' | 'assigned_employee'> {
  assigned_team: string | null
  assigned_team_details?: {
    name: string
  }
  assigned_employee: string | null
  assigned_employee_details?: {
    display_name: string
    role: string
  }
  messages?: TicketMessage[]
  creator?: {
    display_name: string
    role: string
  }
}

// Create ticket input type
export interface CreateTicketInput {
  subject: string
  description: string
  priority?: TicketPriority
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
  assigned_team?: string
  assigned_employee?: string
}

// Create message input type
export interface CreateTicketMessageInput {
  ticket_id: string
  message_type: MessageType
  body: string
}

export interface TicketStats {
  open: number
  inProgress: number
  resolved: number
  total: number
}

export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  assignedTeam?: string
  assignedEmployee?: string
  search?: string
} 