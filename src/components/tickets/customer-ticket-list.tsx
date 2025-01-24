'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { TicketWithDetails } from '@/types/tickets'
import Link from 'next/link'
import { CreateTicketDialog } from './create-ticket-dialog'

interface CustomerTicketListProps {
  tickets: TicketWithDetails[]
  isLoading?: boolean
}

const statusColors = {
  'open': 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
  'closed': 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
} as const

const priorityColors = {
  'low': 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  'medium': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  'high': 'bg-red-100 text-red-700 hover:bg-red-200'
} as const

export function CustomerTicketList({ tickets, isLoading }: CustomerTicketListProps) {
  if (isLoading) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Loading tickets...</div>
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CreateTicketDialog />
      </div>
      <div className="relative w-full overflow-auto">
        {tickets.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No tickets found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.id}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.handling_org?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        ticket.status === 'open'
                          ? 'border-transparent bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20'
                          : ticket.status === 'closed'
                          ? 'border-transparent bg-green-500/10 text-green-700 hover:bg-green-500/20'
                          : 'border-transparent bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
} 