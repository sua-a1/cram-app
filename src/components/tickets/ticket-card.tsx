'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MessageSquare } from 'lucide-react'
import type { TicketWithDetails, TicketStatus, TicketPriority } from '@/types/tickets'

const STATUS_STYLES: Record<TicketStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
  'open': { variant: 'default', label: 'Open' },
  'in-progress': { variant: 'secondary', label: 'In Progress' },
  'closed': { variant: 'outline', label: 'Closed' }
}

const PRIORITY_STYLES: Record<TicketPriority, { color: string, label: string }> = {
  'low': { color: 'text-blue-500', label: 'Low' },
  'medium': { color: 'text-yellow-500', label: 'Medium' },
  'high': { color: 'text-red-500', label: 'High' }
}

interface TicketCardProps {
  ticket: TicketWithDetails
  onView?: (ticket: TicketWithDetails) => void
  onEdit?: (ticket: TicketWithDetails) => void
}

export function TicketCard({ ticket, onView, onEdit }: TicketCardProps) {
  const statusStyle = STATUS_STYLES[ticket.status as TicketStatus]
  const priorityStyle = PRIORITY_STYLES[ticket.priority as TicketPriority]
  const messageCount = ticket.messages?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
          <span className={`text-xs font-medium ${priorityStyle.color}`}>
            {priorityStyle.label} Priority
          </span>
        </div>
        <h3 className="font-semibold truncate">{ticket.subject}</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{messageCount} messages</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onView?.(ticket)}
        >
          View Details
        </Button>
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(ticket)}
          >
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 