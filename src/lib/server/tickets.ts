import { createServiceClient } from '@/lib/server/supabase'
import type { 
  CreateTicketInput, 
  UpdateTicketInput, 
  CreateTicketMessageInput,
  TicketWithDetails,
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  MessageType
} from '@/types/tickets'
import type { Database } from '@/types/database.types'

/**
 * Create a new ticket
 */
export async function createTicket(data: CreateTicketInput & { userId: string }): Promise<Ticket> {
  const serviceClient = createServiceClient()

  // Create the ticket
  const { data: ticket, error: ticketError } = await serviceClient
    .from('tickets')
    .insert({
      user_id: data.userId,
      subject: data.subject,
      description: data.description,
      priority: data.priority || 'medium',
      handling_org_id: data.handling_org_id,
      assigned_team: data.assigned_team,
      assigned_employee: data.assigned_employee,
      status: 'open' as TicketStatus
    })
    .select()
    .single()

  if (ticketError) {
    throw new Error(`Failed to create ticket: ${ticketError.message}`)
  }

  return ticket as unknown as Ticket
}

/**
 * Update an existing ticket
 */
export async function updateTicket(
  ticketId: string, 
  data: UpdateTicketInput
): Promise<Ticket> {
  const serviceClient = createServiceClient()

  // Update the ticket
  const { data: ticket, error: ticketError } = await serviceClient
    .from('tickets')
    .update({
      subject: data.subject,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigned_team: data.assigned_team,
      assigned_employee: data.assigned_employee,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single()

  if (ticketError) {
    throw new Error(`Failed to update ticket: ${ticketError.message}`)
  }

  return ticket as unknown as Ticket
}

/**
 * Add a message to a ticket
 */
export async function createTicketMessage(
  data: CreateTicketMessageInput & { userId: string }
): Promise<TicketMessage> {
  const serviceClient = createServiceClient()

  // Create the message
  const { data: message, error: messageError } = await serviceClient
    .from('ticket_messages')
    .insert({
      ticket_id: data.ticket_id,
      author_id: data.userId,
      message_type: data.message_type as MessageType,
      body: data.body
    })
    .select()
    .single()

  if (messageError) {
    throw new Error(`Failed to create message: ${messageError.message}`)
  }

  return message as unknown as TicketMessage
}

/**
 * Get tickets for an organization with optional filters
 */
export async function getOrganizationTickets(
  orgId: string,
  options: {
    status?: TicketStatus[]
    limit?: number
    offset?: number
  } = {}
): Promise<TicketWithDetails[]> {
  const serviceClient = createServiceClient()

  let query = serviceClient
    .from('tickets')
    .select(`
      *,
      assigned_employee_details:profiles!tickets_assigned_employee_fkey(
        display_name,
        role
      ),
      assigned_team_details:teams!tickets_assigned_team_fkey(
        name
      ),
      creator:profiles!tickets_user_id_fkey(
        display_name,
        role
      )
    `)
    .eq('handling_org_id', orgId)

  // Apply filters
  if (options.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit)
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  // Get tickets
  const { data: tickets, error: ticketsError } = await query
    .order('created_at', { ascending: false })

  if (ticketsError) {
    throw new Error(`Failed to fetch tickets: ${ticketsError.message}`)
  }

  return tickets as unknown as TicketWithDetails[]
}

/**
 * Get a single ticket with all its details
 */
export async function getTicketDetails(ticketId: string): Promise<TicketWithDetails> {
  const serviceClient = createServiceClient()

  const { data: ticket, error: ticketError } = await serviceClient
    .from('tickets')
    .select(`
      *,
      assigned_employee_details:profiles!tickets_assigned_employee_fkey(
        display_name,
        role
      ),
      assigned_team_details:teams!tickets_assigned_team_fkey(
        name
      ),
      creator:profiles!tickets_user_id_fkey(
        display_name,
        role
      ),
      messages:ticket_messages(
        *
      )
    `)
    .eq('id', ticketId)
    .single()

  if (ticketError) {
    throw new Error(`Failed to fetch ticket: ${ticketError.message}`)
  }

  return ticket as unknown as TicketWithDetails
}

/**
 * Get ticket statistics for an organization
 */
export async function getTicketStats(orgId: string) {
  const serviceClient = createServiceClient()

  const { data: stats, error: statsError } = await serviceClient
    .from('tickets')
    .select('status', { count: 'exact' })
    .eq('handling_org_id', orgId)
    .or('status.eq.open,status.eq.in-progress,status.eq.closed')

  if (statsError) {
    throw new Error(`Failed to fetch ticket stats: ${statsError.message}`)
  }

  return stats.reduce((acc, curr) => {
    acc[curr.status as string] = (acc[curr.status as string] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

export async function getCustomerTickets(userId: string): Promise<TicketWithDetails[]> {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      handling_org:organizations(id, name),
      assigned_employee:profiles!assigned_employee(user_id, display_name),
      assigned_team:teams(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customer tickets:', error)
    return []
  }

  return (data || []).map(ticket => ({
    ...ticket,
    handling_org: ticket.handling_org || null,
    assigned_employee_details: ticket.assigned_employee?.[0] || null,
    assigned_team_details: ticket.assigned_team?.[0] || null
  })) as TicketWithDetails[]
}

export async function getCustomerTicketStats(userId: string) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .select('status')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching customer ticket stats:', error)
    return { open: 0, inProgress: 0, closed: 0, total: 0 }
  }

  return {
    open: data.filter(t => t.status === 'open').length,
    inProgress: data.filter(t => t.status === 'in-progress').length,
    closed: data.filter(t => t.status === 'closed').length,
    total: data.length
  }
}

/**
 * Create a new ticket message
 */
export async function createCustomerTicketMessage(data: {
  ticketId: string
  userId: string
  content: string
}) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: data.ticketId,
      body: data.content,
      author_id: data.userId,
      message_type: 'public',
    })

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`)
  }
} 