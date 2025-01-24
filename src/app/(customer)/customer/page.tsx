import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket, MessageSquare, Clock, Bell } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { getCustomerTickets, getCustomerTicketStats } from '@/lib/server/tickets'
import { CustomerTicketSection } from '@/components/tickets/customer-ticket-section'

export const metadata: Metadata = {
  title: 'Customer Dashboard - Cram Support',
  description: 'View your support tickets and account information',
}

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  // Fetch customer's tickets and stats
  const tickets = await getCustomerTickets(user.id)
  const stats = await getCustomerTicketStats(user.id)

  // Calculate unread messages (you'll need to implement this)
  const unreadMessages = 0 // TODO: Implement unread message counting

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.email}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your support tickets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Tickets"
          value={stats.open + stats.inProgress}
          description={`${stats.open} open, ${stats.inProgress} in progress`}
          icon={Ticket}
        />
        <StatsCard
          title="Unread Messages"
          value={unreadMessages}
          description="Messages awaiting your response"
          icon={MessageSquare}
        />
        <StatsCard
          title="Average Response"
          value="2h"
          description="Average response time"
          icon={Clock}
        />
        <StatsCard
          title="Closed Tickets"
          value={stats.closed}
          description="Successfully resolved tickets"
          icon={Bell}
        />
      </div>

      {/* Ticket List Section */}
      <CustomerTicketSection
        userId={user.id}
        tickets={tickets}
        stats={stats}
      />
    </div>
  )
} 