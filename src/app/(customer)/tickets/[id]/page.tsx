import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { TicketDetails } from './ticket-details'
import type { Metadata } from 'next'
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

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
    .single()

  console.log('Ticket query result:', {
    ticket: ticket ? { id: ticket.id, user_id: ticket.user_id } : null,
    error: ticketError ? { code: ticketError.code, message: ticketError.message } : null
  })

  if (ticketError) {
    console.log('Error fetching ticket:', ticketError.code, ticketError.message)
    return notFound()
  }

  if (!ticket) {
    console.log('No ticket found')
    return notFound()
  }

  // Fetch messages separately
  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select(`
      id,
      body,
      author_id,
      author_role,
      author_name,
      author_email,
      message_type,
      created_at,
      updated_at,
      source,
      author:profiles(display_name, role)
    `)
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.log('Error fetching messages:', messagesError.code, messagesError.message)
  }

  const ticketWithDetails = {
    ...ticket,
    messages: messages || [],
    handling_org: null,
    assigned_team: null,
    assigned_employee: null
  }

  return (
    <TicketDetails ticket={ticketWithDetails} userId={user.id} />
  )
} 
