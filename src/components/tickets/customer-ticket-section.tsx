'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/client/supabase'
import type { TicketWithDetails, TicketStatus } from '@/types/tickets'
import type { Database } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { CustomerTicketList } from './customer-ticket-list'
import { TicketStatusFilter } from './ticket-status-filter'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type TicketRow = Database['public']['Tables']['tickets']['Row']

interface CustomerTicketSectionProps {
  userId: string
  tickets: TicketWithDetails[]
  stats: {
    open: number
    inProgress: number
    closed: number
    total: number
  }
}

type TicketChangesPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Database['public']['Tables']['tickets']['Row'] | null
  old: Partial<Database['public']['Tables']['tickets']['Row']> | null
}

export function CustomerTicketSection({
  userId,
  tickets: initialTickets,
  stats: initialStats,
}: CustomerTicketSectionProps) {
  const [tickets, setTickets] = React.useState<TicketWithDetails[]>(initialTickets)
  const [stats, setStats] = React.useState(initialStats)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()

  // Get current status filter from URL
  const statusFilter = searchParams.get('status') || 'all'

  // Filter tickets based on status
  const filteredTickets = React.useMemo(() => {
    if (statusFilter === 'all') return tickets
    return tickets.filter(ticket => ticket.status === statusFilter)
  }, [tickets, statusFilter])

  // Handle status filter change
  const handleStatusChange = (status: TicketStatus | 'all') => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Update local state when props change
  React.useEffect(() => {
    setTickets(initialTickets)
    setStats(initialStats)
  }, [initialTickets, initialStats])

  const updateStats = (
    prev: CustomerTicketSectionProps['stats'],
    status: TicketStatus,
    change: number
  ) => {
    const statKey = status === 'in-progress' ? 'inProgress' : status;
    return {
      ...prev,
      total: prev.total + change,
      [statKey]: prev[statKey as keyof typeof prev] + change,
    };
  };

  const handleTicketChange = React.useCallback(
    async (payload: TicketChangesPayload) => {
      const { eventType } = payload;
      let ticketId: string | undefined;

      if (eventType === 'DELETE' && payload.old?.id && payload.old.status && isValidStatus(payload.old.status)) {
        ticketId = payload.old.id;
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        setStats((prev) => updateStats(prev, payload.old!.status as TicketStatus, -1));
        return;
      }

      if (!payload.new?.id) return;
      ticketId = payload.new.id;

      try {
        const { data: updatedTicket, error } = await supabase
          .from('tickets')
          .select('*, handling_org:organizations(id, name)')
          .eq('id', ticketId)
          .single();

        if (error || !updatedTicket) {
          console.error('Error fetching updated ticket:', error);
          return;
        }

        if (eventType === 'INSERT') {
          setTickets((prev) => [updatedTicket, ...prev]);
          setStats((prev) => updateStats(prev, updatedTicket.status, 1));
        } else if (eventType === 'UPDATE') {
          setTickets((prev) =>
            prev.map((t) => (t.id === ticketId ? updatedTicket : t))
          );
          if (payload.old?.status && isValidStatus(payload.old.status) && payload.old.status !== updatedTicket.status) {
            setStats((prev) => {
              const withOldRemoved = updateStats(prev, payload.old!.status as TicketStatus, -1);
              return updateStats(withOldRemoved, updatedTicket.status, 1);
            });
          }
        }
      } catch (error) {
        console.error('Error handling ticket change:', error);
      }
    },
    [supabase]
  );

  const isValidStatus = (status: string): status is TicketStatus => {
    return ['open', 'in-progress', 'closed'].includes(status);
  };

  React.useEffect(() => {
    type RealtimePayload = {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: Record<string, any>;
      old: Record<string, any>;
      schema: string;
      table: string;
      commit_timestamp: string;
      errors: null | string[];
    };

    const channel = supabase
      .channel('customer-tickets')
      .on<Database['public']['Tables']['tickets']['Row']>(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePayload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          handleTicketChange({
            eventType,
            new: newRecord as Database['public']['Tables']['tickets']['Row'] | null,
            old: oldRecord as Partial<Database['public']['Tables']['tickets']['Row']> | null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, handleTicketChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Tickets</CardTitle>
            <CardDescription>View and manage your support tickets</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TicketStatusFilter 
              currentStatus={statusFilter as TicketStatus | 'all'} 
              onStatusChange={handleStatusChange}
            />
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CustomerTicketList 
          tickets={filteredTickets}
        />
      </CardContent>
    </Card>
  )
} 
