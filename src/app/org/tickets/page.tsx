'use client';

import { TicketList } from '@/components/tickets/ticket-list';
import { useTickets } from '@/hooks/use-tickets';
import { useEffect } from 'react';

export default function TicketsPage() {
  const { tickets, loading, createTicket, updateTicket, fetchTickets } = useTickets();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>
      <TicketList
        tickets={tickets}
        onCreateTicket={createTicket}
        onEditTicket={updateTicket}
        isLoading={loading}
      />
    </div>
  );
} 