'use client';

import { useState } from 'react';
import { useTicketSelection } from './ticket-selection-provider';
import { bulkUpdateTickets } from '@/app/org/tickets/actions';
import { TicketPriority, TicketStatus } from '@/types/tickets';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

export function BulkActionsMenu() {
  const { selectedTickets, selectedCount, clearSelection } = useTicketSelection();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (status: TicketStatus) => {
    if (selectedCount === 0) return;

    setIsLoading(true);
    try {
      const ticketIds = Object.entries(selectedTickets)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      const result = await bulkUpdateTickets({
        ticketIds,
        updates: { status },
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Updated ${result.updatedCount} tickets`,
        });
        clearSelection();
      } else {
        toast({
          title: 'Error',
          description: result.errors?.[0] || 'Failed to update tickets',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityUpdate = async (priority: TicketPriority) => {
    if (selectedCount === 0) return;

    setIsLoading(true);
    try {
      const ticketIds = Object.entries(selectedTickets)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      const result = await bulkUpdateTickets({
        ticketIds,
        updates: { priority },
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Updated ${result.updatedCount} tickets`,
        });
        clearSelection();
      } else {
        toast({
          title: 'Error',
          description: result.errors?.[0] || 'Failed to update tickets',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px]">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="mr-2 h-4 w-4" />
          )}
          {selectedCount} tickets selected
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">Set Status</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleStatusUpdate('open')}>
          Mark as Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate('in-progress')}>
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusUpdate('closed')}>
          Mark as Closed
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">Set Priority</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handlePriorityUpdate('low')}>
          Set Low Priority
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePriorityUpdate('medium')}>
          Set Medium Priority
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePriorityUpdate('high')}>
          Set High Priority
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 