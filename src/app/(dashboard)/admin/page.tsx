'use server'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

async function AdminDashboardContent() {
  // TODO: Fetch admin dashboard data from Supabase
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* TODO: Add dashboard cards/stats */}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TODO: Add team management and system settings */}
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[200px]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    </div>
  )
} 