'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { TicketCard } from './ticket-card'
import { TicketDialog } from './ticket-dialog'
import type { 
  TicketWithDetails, 
  TicketStatus, 
  TicketPriority, 
  CreateTicketInput, 
  UpdateTicketInput 
} from '@/types/tickets'
import { useRouter } from 'next/navigation'
import { TicketListContent } from './ticket-list-content'
import { TicketSelectionProvider } from './ticket-selection-provider'

interface TicketListProps {
  tickets: TicketWithDetails[]
  onCreateTicket: (data: Omit<CreateTicketInput, 'handling_org_id'>) => Promise<void>
  onEditTicket: (id: string, data: UpdateTicketInput) => Promise<void>
  isLoading?: boolean
}

export function TicketList({ 
  tickets, 
  onCreateTicket, 
  onEditTicket,
  isLoading = false
}: TicketListProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<TicketPriority | 'all'>('all')
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editingTicket, setEditingTicket] = React.useState<TicketWithDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Filter tickets based on search and filters
  const filteredTickets = React.useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = search === '' || 
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        (ticket.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const handleCreateSubmit = React.useCallback(
    async (data: Omit<CreateTicketInput, 'handling_org_id'>) => {
      setIsSubmitting(true)
      try {
        await onCreateTicket(data)
        setCreateDialogOpen(false)
      } finally {
        setIsSubmitting(false)
  }
    },
    [onCreateTicket]
  )

  const handleEditSubmit = React.useCallback(
    async (data: UpdateTicketInput) => {
      if (!editingTicket) return
      setIsSubmitting(true)
      try {
        await onEditTicket(editingTicket.id, {
          subject: data.subject,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigned_team: data.assigned_team,
          assigned_employee: data.assigned_employee,
        })
        setEditingTicket(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingTicket, onEditTicket]
    )

  const handleTicketClick = (ticketId: string) => {
    router.push(`/org/tickets/${ticketId}`)
  }

  return (
    <TicketSelectionProvider>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TicketStatus | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as TicketPriority | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <TicketListContent 
          tickets={tickets}
          filteredTickets={filteredTickets}
          isLoading={isLoading}
          handleTicketClick={handleTicketClick}
        />

        {/* Create Dialog */}
        <TicketDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateSubmit}
          mode="create"
          isSubmitting={isSubmitting}
        />

        {/* Edit Dialog */}
        {editingTicket && (
          <TicketDialog
            open={!!editingTicket}
            onOpenChange={() => setEditingTicket(null)}
            onSubmit={handleEditSubmit}
            defaultValues={{
              subject: editingTicket.subject,
              description: editingTicket.description ?? undefined,
              priority: editingTicket.priority as TicketPriority,
              status: editingTicket.status as TicketStatus,
              assigned_team: editingTicket.assigned_team === null ? undefined : editingTicket.assigned_team,
              assigned_employee: editingTicket.assigned_employee === null ? undefined : editingTicket.assigned_employee,
            }}
            mode="edit"
            isSubmitting={isSubmitting}
          />
            )}
      </div>
    </TicketSelectionProvider>
  )
} 