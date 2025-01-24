'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { BulkActionsMenu } from './bulk-actions-menu'
import { SelectableTicketRow } from './selectable-ticket-row'
import { useTicketSelection } from './ticket-selection-provider'
import type { TicketWithDetails } from '@/types/tickets'

interface TicketListContentProps {
  tickets: TicketWithDetails[]
  filteredTickets: TicketWithDetails[]
  isLoading: boolean
  handleTicketClick: (id: string) => void
}

export function TicketListContent({ 
  tickets,
  filteredTickets,
  isLoading,
  handleTicketClick
}: TicketListContentProps) {
  const { selectAll, clearSelection, selectedCount } = useTicketSelection()

  const handleSelectAll = () => {
    if (selectedCount === tickets.length) {
      clearSelection()
    } else {
      selectAll(tickets.map((t) => t.id))
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedCount === tickets.length ? 'Deselect All' : 'Select All'}
        </Button>
        <BulkActionsMenu />
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[200px] rounded-lg border bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => (
            <SelectableTicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tickets found.</p>
        </div>
      )}
    </>
  )
} 