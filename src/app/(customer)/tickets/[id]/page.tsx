import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { TicketDetails } from './ticket-details'
import type { Metadata } from 'next'
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { TicketStatus, TicketPriority, MessageType } from '@/types/tickets'

type TicketResponse = Database['public']['Tables']['tickets']['Row'] & {
  handling_org: { id: string; name: string } | null
  assigned_team_details: { id: string; name: string } | null
  assigned_employee_details: { user_id: string; display_name: string } | null
  creator: { display_name: string; role: string } | null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await getCurrentUser()
  if (!user) {
    console.log('No user found in generateMetadata')
    return notFound()
  }

  const supabase = createServiceClient()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      id,
      subject
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.log('Error in generateMetadata:', error.code, error.message)
    return {
      title: 'Ticket Not Found',
      description: 'The ticket could not be found'
    }
  }

  return {
    title: ticket?.subject ? `${ticket.subject} - Cram Support` : 'Ticket Not Found',
    description: ticket?.subject || 'The ticket could not be found'
  }
}

export default async function CustomerTicketPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    console.log('No user found in CustomerTicketPage')
    return notFound()
  }

  console.log('Current user:', { id: user.id, email: user.email, role: user.role })
  console.log('Requested ticket ID:', params.id)
  
  const supabase = createServiceClient()
  
  // Debug query to see all tickets for this user
  const { data: userTickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('user_id', user.id)
  
  console.log('Available tickets:', userTickets)
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      id,
      user_id,
      subject,
      description,
      status,
      priority,
      handling_org_id,
      assigned_team,
      assigned_employee,
      created_at,
      updated_at
    `)
    .eq('id', params.id)
    .eq('user_id', user.id) // Manually check ownership
    .single() as { data: Database['public']['Tables']['tickets']['Row'], error: PostgrestError | null }

  if (ticketError || !ticket) {
    console.log('Error fetching ticket:', ticketError?.code, ticketError?.message)
    return notFound()
  }

  // Fetch messages separately
  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select(`
      id,
      ticket_id,
      author_id,
      author_role,
      author_name,
      author_email,
      body,
      message_type,
      created_at,
      updated_at,
      is_email,
      metadata,
      template_id,
      parent_message_id,
      source,
      external_id,
      author:profiles(display_name, role)
    `)
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20) as { 
      data: (Database['public']['Tables']['ticket_messages']['Row'] & {
        author?: Array<{ display_name: string; role: string }>
      })[] | null;
      error: PostgrestError | null;
    }

  if (messagesError) {
    console.log('Error fetching messages:', messagesError.code, messagesError.message)
  }

  // Get total count of messages
  const { count: totalMessages } = await supabase
    .from('ticket_messages')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_id', params.id)

  if (!messages) {
    console.log('No messages found')
    return notFound()
  }

  // Add type guard for messages
  function isMessageData(data: unknown): data is (Database['public']['Tables']['ticket_messages']['Row'] & {
    author?: Array<{ display_name: string; role: string }>
  })[] {
    return Array.isArray(data) && data.every(msg => 
      msg !== null && 
      typeof msg === 'object' && 
      'id' in msg && 
      'ticket_id' in msg &&
      'author_role' in msg &&
      'message_type' in msg
    );
  }

  if (!messages || !isMessageData(messages)) {
    console.log('Invalid messages data')
    return notFound()
  }

  const ticketWithDetails = {
    id: ticket.id,
    user_id: ticket.user_id,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    handling_org_id: ticket.handling_org_id,
    messages: messages.map(msg => ({
      id: msg.id,
      ticket_id: msg.ticket_id,
      author_id: msg.author_id,
      author_role: msg.author_role as 'customer' | 'employee' | 'admin',
      author_name: msg.author_name || msg.author?.[0]?.display_name || null,
      author_email: msg.author_email || null,
      body: msg.body,
      message_type: msg.message_type as MessageType,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      source: (msg.source || 'web') as 'web' | 'email' | 'api',
      author: msg.author?.[0],
      is_email: msg.is_email || false,
      metadata: msg.metadata || {},
      template_id: msg.template_id,
      parent_message_id: msg.parent_message_id,
      external_id: msg.external_id
    })) satisfies TicketMessage[],
    hasMoreMessages: totalMessages ? totalMessages > 20 : false,
    totalMessages,
    handling_org: null,
    assigned_team: null,
    assigned_employee: null,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at
  } satisfies TicketWithDetails & {
    hasMoreMessages: boolean;
    totalMessages: number | null;
  }

  return (
    <TicketDetails ticket={ticketWithDetails} userId={user.id} />
  )
} 
