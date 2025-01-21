import { Metadata } from 'next'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'New Ticket - Cram Support',
  description: 'Create a new support ticket',
}

export default function NewTicketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground">Submit a new support request</p>
      </div>

      <Card className="p-6">
        {/* TODO: Add ticket creation form */}
        <p className="text-sm text-muted-foreground">Ticket creation form coming soon</p>
      </Card>
    </div>
  )
} 