'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CustomerMessageInterface } from '@/components/tickets/customer-message-interface'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { TicketWithDetails, TicketMessage, MessageType } from '@/types/tickets'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type TicketStatus = 'open' | 'in-progress' | 'closed'

interface TicketDetailsProps {
  ticket: TicketWithDetails & {
    hasMoreMessages: boolean;
    totalMessages: number | null;
  }
  userId: string
}

function MessageItem({ message, isCurrentUser }: { message: TicketMessage; isCurrentUser: boolean }) {
  const displayName = isCurrentUser 
    ? 'You' 
    : message.author_role === 'customer'
      ? message.author_name || 'Unknown Customer'
      : message.author?.display_name || 'Unknown User';

  const avatarInitial = isCurrentUser 
    ? 'Y' 
    : message.author_role === 'customer'
      ? (message.author_name?.[0] || 'C')
      : message.author?.display_name?.[0] || 'U';

  return (
    <div className={cn(
      'flex gap-3 p-4 group relative',
      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{avatarInitial}</AvatarFallback>
      </Avatar>
      
      <div className={cn(
        'flex flex-col relative',
        isCurrentUser ? 'items-end' : 'items-start',
        'max-w-[85%]'
      )}>
        <div className="mb-1">
          <span className="text-sm font-medium">{displayName}</span>
          {message.author_role === 'customer' && message.author_email && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({message.author_email})
            </span>
          )}
          {message.author?.role && message.author_role !== 'customer' && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({message.author.role})
            </span>
          )}
        </div>

        <div className={cn(
          'rounded-lg p-3',
          isCurrentUser 
            ? 'bg-primary text-primary-foreground [&_.prose]:text-primary-foreground [&_.prose_a]:text-primary-foreground [&_.prose_strong]:text-primary-foreground [&_.prose_img]:max-w-full [&_.prose_img]:rounded-md' 
            : 'bg-muted [&_.prose]:text-foreground [&_.prose_img]:max-w-full [&_.prose_img]:rounded-md'
        )}>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_img]:!my-2 [&_img]:inline-block [&_img]:!max-h-[300px] [&_img]:object-contain"
            dangerouslySetInnerHTML={{ __html: message.body }} 
          />
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

export function TicketDetails({ ticket, userId }: TicketDetailsProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(
    // Sort messages by created_at in descending order (newest first)
    // to match our flex-col-reverse display
    (ticket.messages || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  )
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(ticket.status as TicketStatus)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(ticket.hasMoreMessages)
  const [page, setPage] = useState(1)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 20

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'instant'
      });
    }
  }, []);

  // Function to preserve scroll position
  const preserveScroll = useCallback((fn: () => void) => {
    if (!scrollContainerRef.current) return fn();

    const scrollContainer = scrollContainerRef.current;
    const scrollHeight = scrollContainer.scrollHeight;
    const scrollTop = scrollContainer.scrollTop;

    fn();

    // After state update and re-render
    requestAnimationFrame(() => {
      const newScrollHeight = scrollContainer.scrollHeight;
      const heightDifference = newScrollHeight - scrollHeight;
      scrollContainer.scrollTop = scrollTop + heightDifference;
    });
  }, []);

  // Function to fetch messages with pagination
  const fetchMessages = useCallback(async (pageNumber: number) => {
    try {
      setLoading(true);
      console.log('Fetching messages for page:', pageNumber);

      const start = (pageNumber - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data: messageData, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          author:profiles(display_name, role)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      const newMessages = messageData.map(msg => ({
        ...msg,
        author: msg.author?.[0],
        author_role: msg.author_role as 'customer' | 'employee' | 'admin',
        message_type: msg.message_type as MessageType,
        source: msg.source as 'web' | 'email' | 'api'
      })) satisfies TicketMessage[];

      // Update messages state while preserving scroll
      preserveScroll(() => {
        setMessages(prev => {
          // Create a map of existing messages by ID
          const existingMessages = new Map(prev.map(msg => [msg.id, msg]));
          
          // Add new messages to the map
          newMessages.forEach(msg => {
            existingMessages.set(msg.id, msg);
          });
          
          // Convert map back to array and sort by created_at in descending order
          return Array.from(existingMessages.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
      });

      // Update hasMore based on total messages count
      setHasMore(ticket.totalMessages ? (start + messageData.length) < ticket.totalMessages : false);

    } catch (error: any) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: 'Error loading messages',
        description: error?.message || 'Failed to load messages. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [ticket.id, ticket.totalMessages, supabase, toast, preserveScroll]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    if (scrollTop === 0 && hasMore && !loading) {
      console.log('Scrolled to top, loading more messages');
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  // Load initial messages and set up subscriptions
  useEffect(() => {
    let mounted = true;
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        async (payload: RealtimePostgresChangesPayload<{
          id: string
          ticket_id: string
          author_id: string
          body: string
          message_type: MessageType
          created_at: string
        }>) => {
          if (!mounted) return
          console.log('Message change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Fetch the complete message with author details
            const { data: messageData, error } = await supabase
              .from('ticket_messages')
              .select(`
                *,
                author:profiles(display_name, role)
              `)
              .eq('id', payload.new.id)
              .single()

            if (error) {
              console.error('Error fetching message details:', error)
              return
            }

            if (!messageData) return

            const newMessage = {
              ...messageData,
              author: messageData.author?.[0],
              author_role: messageData.author_role as 'customer' | 'employee' | 'admin',
              message_type: messageData.message_type as MessageType,
              source: messageData.source as 'web' | 'email' | 'api'
            } satisfies TicketMessage

            // Add new message to the beginning since we're sorting by created_at DESC
            setMessages(prev => [newMessage, ...prev])
            // Scroll to bottom for new messages
            setTimeout(scrollToBottom, 100)
          } 
          else if (payload.eventType === 'UPDATE') {
            // Fetch updated message with author details
            const { data: messageData, error } = await supabase
              .from('ticket_messages')
              .select(`
                *,
                author:profiles(display_name, role)
              `)
              .eq('id', payload.new.id)
              .single()

            if (error) {
              console.error('Error fetching message details:', error)
              return
            }

            if (!messageData) return

            const updatedMessage = {
              ...messageData,
              author: messageData.author?.[0],
              author_role: messageData.author_role as 'customer' | 'employee' | 'admin',
              message_type: messageData.message_type as MessageType,
              source: messageData.source as 'web' | 'email' | 'api'
            } satisfies TicketMessage

            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            )
          }
          else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old?.id))
          }
        }
      )
      // Ticket status subscription
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticket.id}`
        },
        (payload: RealtimePostgresChangesPayload<{
          id: string
          status: TicketStatus
        }>) => {
          if (!mounted) return
          console.log('Ticket status change received:', payload)
          
          if (payload.eventType === 'UPDATE' && payload.new && 'status' in payload.new) {
            setTicketStatus(payload.new.status)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (mounted) {
          setIsSubscribed(status === 'SUBSCRIBED')
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to updates')
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error('Subscription status:', status)
            toast({
              title: 'Connection Error',
              description: 'Lost connection to updates. Please refresh the page.',
              variant: 'destructive'
            })
          }
        }
      })

    return () => {
      console.log('Cleaning up subscription')
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [ticket.id, supabase, toast, scrollToBottom])

  // Load more messages when page changes
  useEffect(() => {
    if (page > 1) {
      fetchMessages(page);
    }
  }, [page, fetchMessages]);

  // Initial scroll behavior
  useEffect(() => {
    if (initialLoadRef.current) {
      setTimeout(scrollToBottom, 100)
      initialLoadRef.current = false
    }
  }, [scrollToBottom])

  const onMessageSent = () => {
    // Messages will be updated automatically through the subscription
    if (!isSubscribed) {
      // If subscription isn't active, show a warning
      toast({
        title: 'Warning',
        description: 'Real-time updates may be delayed. Please refresh the page if you don\'t see your message.',
        variant: 'destructive'
      })
    }
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
        <Card className="flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="flex-none border-b">
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto min-h-0 relative"
              onScroll={handleScroll}
            >
              {loading && page > 1 && (
                <div className="sticky top-0 p-4 text-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              )}
              <div className="flex flex-col-reverse">
                {messages.map((message) => (
                  <MessageItem 
                    key={message.id}
                    message={message}
                    isCurrentUser={message.author_id === userId}
                  />
                ))}
              </div>
            </div>
            {ticketStatus !== 'closed' && (
              <div className="flex-none border-t">
                <CustomerMessageInterface
                  ticketId={ticket.id}
                  onMessageSent={onMessageSent}
                  disabled={!isSubscribed}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 