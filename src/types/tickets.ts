import { type Database } from './supabase'

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketInsert = Database['public']['Tables']['tickets']['Insert']
export type TicketUpdate = Database['public']['Tables']['tickets']['Update']

export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketMessageInsert = Database['public']['Tables']['ticket_messages']['Insert']
export type TicketMessageUpdate = Database['public']['Tables']['ticket_messages']['Update']

export type TicketStatus = Ticket['status']
export type TicketPriority = Ticket['priority']
export type MessageType = TicketMessage['type']

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