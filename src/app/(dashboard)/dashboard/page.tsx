import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, MessageSquare, Clock, Bell, LogOut, UserX } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { DeleteAccountButton } from '@/components/auth/delete-account-button'

export const metadata: Metadata = {
  title: 'Dashboard - Cram Support',
  description: 'View your support tickets and account information',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.display_name}!</h1>
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

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent support ticket activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to display</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common actions you can take</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start">
              <Ticket className="mr-2 h-4 w-4" />
              Create New Ticket
            </Button>
            <Button variant="outline" className="justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              View All Tickets
            </Button>
            <SignOutButton />
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 