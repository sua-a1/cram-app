'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TicketStatus } from '@/types/tickets'

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
]

interface TicketStatusFilterProps {
  currentStatus: TicketStatus | 'all'
  onStatusChange: (status: TicketStatus | 'all') => void
}

export function TicketStatusFilter({ currentStatus, onStatusChange }: TicketStatusFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {currentStatus !== 'all' && (
            <span className="ml-2 rounded bg-primary px-1 text-xs text-primary-foreground">
              1
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={currentStatus === 'all'}
          onCheckedChange={() => onStatusChange('all')}
        >
          All
        </DropdownMenuCheckboxItem>
        {statusOptions.map(({ value, label }) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={currentStatus === value}
            onCheckedChange={() => onStatusChange(value as TicketStatus)}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
