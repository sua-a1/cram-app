'use server'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function EmployeeDashboardContent() {
  // TODO: Fetch employee's assigned tickets and stats from Supabase
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* TODO: Add ticket stats (assigned, in progress, resolved) */}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Assigned Tickets</h2>
        {/* TODO: Add ticket list component */}
      </div>
    </div>
  )
}

export default async function EmployeeDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <EmployeeDashboardContent />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[250px]" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[100px]" />
        <Skeleton className="h-[100px]" />
        <Skeleton className="h-[100px]" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="space-y-3">
          <Skeleton className="h-[60px]" />
          <Skeleton className="h-[60px]" />
          <Skeleton className="h-[60px]" />
        </div>
      </div>
    </div>
  )
} 