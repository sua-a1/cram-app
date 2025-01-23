import { SignOutButton } from '@/components/org/signout-button'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { TicketSection } from '@/components/dashboard/ticket-section'
import { createTicket, updateTicket, getOrganizationTickets, getTicketStats } from '@/lib/server/tickets'
import { createServiceClient } from '@/lib/server/supabase'
import type { 
  TicketWithDetails, 
  CreateTicketInput, 
  UpdateTicketInput 
} from '@/types/tickets'
import type { Database } from '@/types/database.types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

export default async function Dashboard() {
  // Create clients that can be used for this request
  const cookieStore = cookies()
  const serviceClient = createServiceClient()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  let profile: Profile | null = null
  let org: Organization | null = null
  let tickets: TicketWithDetails[] = []
  let ticketStats = { open: 0, inProgress: 0, closed: 0 }
  let errors: string[] = []

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Auth error:', userError)
    redirect('/org/org-auth/signin')
  }

  // Get user's profile with org_id using service client
  const { data: profileData, error: profileError } = await serviceClient
    .from('profiles')
    .select('user_id, org_id, role, display_name')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    console.error('Profile error:', profileError)
    errors.push(`Error fetching profile: ${profileError.message}`)
    redirect('/org/org-auth/access')
  } else {
    profile = profileData as Profile
  }

  // Ensure user has org access
  if (!profile?.org_id || (profile.role !== 'employee' && profile.role !== 'admin')) {
    console.error('No org access:', { profile })
    redirect('/org/org-auth/access')
  }

  // Get organization details using service client
  const { data: orgData, error: orgError } = await serviceClient
    .from('organizations')
    .select('id, name')
    .eq('id', profile.org_id)
    .single()

  if (orgError) {
    console.error('Org error:', orgError)
    errors.push(`Error fetching organization: ${orgError.message}`)
  } else {
    org = orgData as Organization

    // Get tickets and stats
    try {
      tickets = await getOrganizationTickets(profile.org_id)
      const stats = await getTicketStats(profile.org_id)
      ticketStats = {
        open: stats['open'] || 0,
        inProgress: stats['in-progress'] || 0,
        closed: stats['closed'] || 0
      }
    } catch (error: any) {
      console.error('Tickets error:', error)
      errors.push(`Error fetching tickets: ${error?.message || 'Unknown error'}`)
    }
  }

  async function handleCreateTicket(data: CreateTicketInput) {
    'use server'
    if (!profile?.user_id) throw new Error('User ID is required')
    if (!profile.org_id) throw new Error('Organization ID is required')
    await createTicket({
      ...data,
      userId: profile.user_id,
      handling_org_id: profile.org_id
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
            <h3 className="font-semibold mb-2">Organization</h3>
            {org ? (
              <>
                <p className="text-sm text-muted-foreground">ID: {org.id}</p>
                <p className="text-sm text-muted-foreground mt-1">Name: {org.name}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No organization data available</p>
            )}
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">User</h3>
            {profile ? (
              <>
                <p className="text-sm text-muted-foreground">ID: {profile.user_id}</p>
                <p className="text-sm text-muted-foreground mt-1">Name: {profile.display_name}</p>
                <p className="text-sm text-muted-foreground mt-1">Role: {profile.role}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No user data available</p>
            )}
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-2">Ticket Stats</h3>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Open: {ticketStats.open}</p>
              <p className="text-sm text-muted-foreground">In Progress: {ticketStats.inProgress}</p>
              <p className="text-sm text-muted-foreground">Closed: {ticketStats.closed}</p>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        {profile?.org_id && (
          <TicketSection
            orgId={profile.org_id}
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