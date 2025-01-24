'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useTicketSelection } from './ticket-selection-provider';
import { TicketWithDetails } from '@/types/tickets';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SelectableTicketRowProps {
  ticket: TicketWithDetails;
  onClick?: () => void;
}

export function SelectableTicketRow({ ticket, onClick }: SelectableTicketRowProps) {
  const { isSelected, toggleTicket } = useTicketSelection();
  const selected = isSelected(ticket.id);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTicket(ticket.id);
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-4 p-4 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors',
        selected && 'bg-muted'
      )}
      onClick={onClick}
    >
      <div onClick={handleCheckboxClick}>
        <Checkbox checked={selected} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium truncate">{ticket.subject}</h4>
          <div className="flex gap-2">
            <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
              {ticket.priority}
            </Badge>
            <Badge
              variant={
                ticket.status === 'closed'
                  ? 'secondary'
                  : ticket.status === 'in-progress'
                  ? 'default'
                  : 'outline'
              }
            >
              {ticket.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>
            Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
          </span>
          {ticket.assigned_employee_details && (
            <span>
              Assigned to {ticket.assigned_employee_details.display_name}
            </span>
          )}
          {ticket.assigned_team_details && (
            <span>Team: {ticket.assigned_team_details.name}</span>
          )}
        </div>
      </div>
    </div>
  );
} 