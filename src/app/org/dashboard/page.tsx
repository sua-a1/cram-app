import { SignOutButton } from '@/components/org/signout-button'
import { createServiceClient } from '@/lib/server/supabase'
import { TicketSection } from '@/components/dashboard/ticket-section'
import { createTicket, updateTicket, getOrganizationTickets, getTicketStats } from '@/lib/server/tickets'
import type { 
  TicketWithDetails, 
  CreateTicketInput, 
  UpdateTicketInput 
} from '@/types/tickets'
import { revalidatePath } from 'next/cache'

export default async function Dashboard({
  searchParams
}: {
  searchParams: { orgId?: string; userId?: string }
}) {
  const { orgId, userId } = searchParams
  const serviceClient = createServiceClient()
  let profile = null
  let org = null
  let tickets: TicketWithDetails[] = []
  let ticketStats = { open: 0, inProgress: 0, closed: 0 }
  let errors: string[] = []

  // Try to get profile if we have userId
  if (userId) {
    const { data: profileData, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      errors.push(`Error fetching profile: ${profileError.message}`)
    } else {
      profile = profileData
    }
  }

  // Try to get org if we have orgId
  if (orgId) {
    const { data: orgData, error: orgError } = await serviceClient
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    if (orgError) {
      errors.push(`Error fetching organization: ${orgError.message}`)
    } else {
      org = orgData

      // Get tickets and stats if we have org
      try {
        tickets = await getOrganizationTickets(orgId)
        const stats = await getTicketStats(orgId)
        ticketStats = {
          open: stats['open'] || 0,
          inProgress: stats['in-progress'] || 0,
          closed: stats['closed'] || 0
        }
      } catch (error: any) {
        errors.push(`Error fetching tickets: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  async function handleCreateTicket(data: CreateTicketInput) {
    'use server'
    if (!userId) throw new Error('User ID is required')
    await createTicket({
      ...data,
      userId,
      handling_org_id: orgId!
    })
    revalidatePath('/org/dashboard')
  }

  async function handleEditTicket(id: string, data: UpdateTicketInput) {
    'use server'
    await updateTicket(id, data)
    revalidatePath('/org/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {org?.name || 'Organization'} {profile?.role === 'admin' ? 'Admin' : 'Employee'} Dashboard
            </h1>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        {/* Show any errors */}
        {errors.length > 0 && (
          <div className="mb-8 p-4 border border-red-200 rounded bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">Errors:</h3>
            <ul className="list-disc pl-4">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-red-800">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Organization Info */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">Organization ID</h3>
            <p className="text-sm text-muted-foreground">{orgId || 'Not provided'}</p>
            {org && (
              <p className="text-sm text-muted-foreground mt-1">Name: {org.name}</p>
            )}
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">User ID</h3>
            <p className="text-sm text-muted-foreground">{userId || 'Not provided'}</p>
            {profile && (
              <p className="text-sm text-muted-foreground mt-1">Role: {profile.role}</p>
            )}
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">Profile Data</h3>
            {profile ? (
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(profile, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No profile data available</p>
            )}
          </div>
        </div>

        {/* Tickets Section */}
        {orgId && profile && (
          <TicketSection
            orgId={orgId}
            isAdmin={profile.role === 'admin'}
            tickets={tickets}
            stats={ticketStats}
            onCreateTicket={handleCreateTicket}
            onEditTicket={handleEditTicket}
          />
        )}
      </main>
    </div>
  )
} 