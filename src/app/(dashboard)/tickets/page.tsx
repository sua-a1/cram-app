'use server'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function TicketListContent() {
  // TODO: Fetch tickets from Supabase based on user role
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tickets</h1>
        {/* TODO: Add ticket actions (create, filter, sort) */}
      </div>

      <div className="space-y-2">
        {/* TODO: Add filters and search */}
      </div>

      <div className="rounded-md border">
        {/* TODO: Add ticket list with status, priority, etc. */}
      </div>

      <div className="flex items-center justify-between">
        {/* TODO: Add pagination */}
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

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>
    </div>
  )
} 