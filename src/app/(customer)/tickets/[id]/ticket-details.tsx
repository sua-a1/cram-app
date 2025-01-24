'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageList } from '@/components/tickets/message-list'
import { CustomerMessageInterface } from '@/components/tickets/customer-message-interface'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'

type TicketStatus = 'open' | 'in-progress' | 'closed'

interface TicketDetailsProps {
  ticket: TicketWithDetails
  userId: string
}

export function TicketDetails({ ticket, userId }: TicketDetailsProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages || [])
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(ticket.status as TicketStatus)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        async (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new: { id: string } | null
          old: { id: string } | null
        }) => {
          console.log('Message change received:', payload)
          
          const messageId = payload.eventType === 'DELETE' 
            ? payload.old?.id 
            : payload.new?.id

          if (!messageId) return

          if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== messageId))
            return
          }

          const { data: newMessage } = await supabase
            .from('ticket_messages')
            .select(`
              *,
              author:profiles(display_name, role)
            `)
            .eq('id', messageId)
            .single()

          if (!newMessage) return

          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, newMessage as unknown as TicketMessage])
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === messageId ? (newMessage as unknown as TicketMessage) : msg
              )
            )
          }
        }
      )
      .subscribe()

    // Set up real-time subscription for ticket status changes
    const ticketChannel = supabase
      .channel(`ticket-status-${ticket.id}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticket.id}`
        },
        (payload: {
          new: { status: TicketStatus } | null
        }) => {
          if (payload.new?.status) {
            setTicketStatus(payload.new.status)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(ticketChannel)
    }
  }, [ticket.id, supabase])

  const onMessageSent = () => {
    // Messages will be updated automatically through the subscription
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge variant={ticketStatus === 'open' ? 'default' : ticketStatus === 'in-progress' ? 'secondary' : 'outline'}>
                    {ticketStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="mt-1 text-sm">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Subject</div>
              <div className="mt-1 text-sm">{ticket.subject}</div>
            </div>
            {ticket.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{ticket.description}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <MessageList messages={messages} currentUserId={userId} />
            {ticketStatus !== 'closed' && (
              <CustomerMessageInterface
                ticketId={ticket.id}
                onMessageSent={() => {}}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 