'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket as TicketIcon, Clock, AlertCircle } from 'lucide-react'
import { TicketList } from '@/components/tickets/ticket-list'
import { createBrowserClient } from '@/lib/client/supabase'
import type { TicketWithDetails, CreateTicketInput, UpdateTicketInput } from '@/types/tickets'
import type { Database } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TicketRow = Database['public']['Tables']['tickets']['Row']
type TicketChangesPayload = RealtimePostgresChangesPayload<TicketRow>

interface TicketSectionProps {
  orgId: string
  isAdmin: boolean
  tickets: TicketWithDetails[]
  stats: {
    open: number
    inProgress: number
    closed: number
  }
  onCreateTicket: (data: CreateTicketInput) => Promise<void>
  onEditTicket: (id: string, data: UpdateTicketInput) => Promise<void>
  isLoading?: boolean
}

export function TicketSection({
  orgId,
  isAdmin,
  tickets: initialTickets,
  stats: initialStats,
  onCreateTicket,
  onEditTicket,
  isLoading: initialLoading
}: TicketSectionProps) {
  const [tickets, setTickets] = React.useState<TicketWithDetails[]>(initialTickets)
  const [stats, setStats] = React.useState(initialStats)
  const [isLoading, setIsLoading] = React.useState(initialLoading)

  // Update local state when props change
  React.useEffect(() => {
    setTickets(initialTickets)
    setStats(initialStats)
  }, [initialTickets, initialStats])

  const highPriorityCount = React.useMemo(() => 
    tickets.filter(ticket => ticket.priority === 'high').length,
    [tickets]
  )

  const handleCreateTicket = React.useCallback(
    async (data: Omit<CreateTicketInput, 'handling_org_id'>) => {
      setIsLoading(true)
      try {
        await onCreateTicket({
          ...data,
          handling_org_id: orgId
        })
      } finally {
        setIsLoading(false)
      }
    },
    [onCreateTicket, orgId]
  )

  // Set up real-time subscription
  React.useEffect(() => {
    const supabase = createBrowserClient()

    // Subscribe to changes in the tickets table
    const channel = supabase
      .channel('tickets-changes')
      .on<TicketRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `handling_org_id=eq.${orgId}`
        },
        async (payload: TicketChangesPayload) => {
          console.log('Received ticket change:', payload) // Debug log

          // For delete events, just update the state
          if (payload.eventType === 'DELETE' && payload.old) {
            console.log('Handling DELETE event') // Debug log
            setTickets(currentTickets => 
              currentTickets.filter(ticket => ticket.id !== payload.old!.id)
            )

            // Update stats for deleted ticket
            setStats(currentStats => {
              const newStats = { ...currentStats }
              if (payload.old!.status === 'open') newStats.open--
              else if (payload.old!.status === 'in-progress') newStats.inProgress--
              else if (payload.old!.status === 'closed') newStats.closed--
              return newStats
            })

            return
          }

          // For INSERT and UPDATE events, fetch the updated ticket
          if (payload.eventType !== 'DELETE' && payload.new?.id) {
            console.log('Handling INSERT/UPDATE event') // Debug log
            const { data: updatedTicket, error } = await supabase
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
              .eq('id', payload.new.id)
              .single()

            if (error) {
              console.error('Error fetching updated ticket:', error)
              return
            }

            console.log('Fetched updated ticket:', updatedTicket) // Debug log

            // Update tickets list based on the event type
            setTickets(currentTickets => {
              if (payload.eventType === 'INSERT') {
                return [updatedTicket as TicketWithDetails, ...currentTickets]
              } else if (payload.eventType === 'UPDATE') {
                const updatedTickets = currentTickets.map(ticket => 
                  ticket.id === payload.new!.id ? (updatedTicket as TicketWithDetails) : ticket
                )
                console.log('Updated tickets list:', updatedTickets) // Debug log
                return updatedTickets
              }
              return currentTickets
            })

            // Update stats
            setStats(currentStats => {
              const newStats = { ...currentStats }
              
              if (payload.eventType === 'INSERT') {
                // Handle new ticket
                if (payload.new!.status === 'open') newStats.open++
                else if (payload.new!.status === 'in-progress') newStats.inProgress++
                else if (payload.new!.status === 'closed') newStats.closed++
              } 
              else if (payload.eventType === 'UPDATE' && payload.old) {
                // Handle status change
                const oldStatus = payload.old.status
                const newStatus = payload.new!.status

                // Only update stats if status has changed
                if (oldStatus !== newStatus) {
                  // Decrement old status count
                  if (oldStatus === 'open') newStats.open--
                  else if (oldStatus === 'in-progress') newStats.inProgress--
                  else if (oldStatus === 'closed') newStats.closed--
                  
                  // Increment new status count
                  if (newStatus === 'open') newStats.open++
                  else if (newStatus === 'in-progress') newStats.inProgress++
                  else if (newStatus === 'closed') newStats.closed++
                }
              }
              
              console.log('Updated stats:', newStats) // Debug log
              return newStats
            })
          }
        }
      )
      .subscribe()

    console.log('Subscribed to ticket changes') // Debug log

    return () => {
      console.log('Unsubscribing from ticket changes') // Debug log
      supabase.removeChannel(channel)
    }
  }, [orgId])

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment or action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being handled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            All Tickets
          </h2>
        </div>
        <TicketList
          tickets={tickets}
          onCreateTicket={handleCreateTicket}
          onEditTicket={onEditTicket}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
} 