import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, MessageSquare, Clock, Bell } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Customer Dashboard - Cram Support',
  description: 'View your support tickets and account information',
}

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.email}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your support tickets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Tickets"
          value="0"
          description="No active tickets"
          icon={Ticket}
        />
        <StatsCard
          title="Unread Messages"
          value="0"
          description="No unread messages"
          icon={MessageSquare}
        />
        <StatsCard
          title="Average Response"
          value="--"
          description="No data available"
          icon={Clock}
        />
        <StatsCard
          title="Notifications"
          value="0"
          description="No new notifications"
          icon={Bell}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Your recent support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent tickets to display</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common actions you can take</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/tickets/new">
                <Ticket className="mr-2 h-4 w-4" />
                Create New Ticket
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tickets">
                <MessageSquare className="mr-2 h-4 w-4" />
                View All Tickets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 