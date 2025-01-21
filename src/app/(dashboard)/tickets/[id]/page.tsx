'use server'

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  params: {
    id: string
  }
}

async function TicketDetails({ id }: { id: string }) {
  // TODO: Fetch ticket details from Supabase
  const ticket = null

  if (!ticket) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ticket #{id}</h1>
      {/* TODO: Add ticket details UI */}
    </div>
  )
}

export default async function TicketPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
      <TicketDetails id={params.id} />
    </Suspense>
  )
} 