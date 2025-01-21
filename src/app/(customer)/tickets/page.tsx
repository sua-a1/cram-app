import { Suspense } from 'react'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Ticket, Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'My Tickets - Cram Support',
  description: 'View and manage your support tickets',
}

async function TicketListContent() {
  // TODO: Fetch customer's tickets from Supabase
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <Button asChild>
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {/* TODO: Add filters and search */}
      </div>

      <div className="rounded-md border">
        {/* TODO: Add ticket list with status, priority, etc. */}
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Ticket className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p>No tickets found</p>
          <p>Create a new ticket to get started</p>
        </div>
      </div>
    </div>
  )
}

export default async function TicketsPage() {
  return (
    <Suspense fallback={<TicketsPageSkeleton />}>
      <TicketListContent />
    </Suspense>
  )
}

function TicketsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-[60px]" />
        <Skeleton className="h-[60px]" />
        <Skeleton className="h-[60px]" />
        <Skeleton className="h-[60px]" />
        <Skeleton className="h-[60px]" />
      </div>
    </div>
  )
} 