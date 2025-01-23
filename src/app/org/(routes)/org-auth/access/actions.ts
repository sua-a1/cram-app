'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Add service client import
import { createClient } from '@supabase/supabase-js'

export async function joinAction(formData: FormData) {
  const organizationId = formData.get('organizationId')?.toString()
  console.log('Join Action - Start', { organizationId })
  
  if (!organizationId) {
    console.error('Join Action - No organization ID provided')
    return { error: 'No organization ID provided' }
  }

  try {
    // Create service client for admin access
    const serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for user operations
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current session to identify the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Join Action - Session check:', { session: !!session, sessionError })
    
    if (sessionError || !session?.user) {
      console.error('Join Action - Session error:', sessionError)
      return { error: sessionError?.message || 'No active session' }
    }

    // Use service client to get organization details
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, name, status')
      .eq('id', organizationId)
      .eq('status', 'active')
      .single()

    console.log('Join Action - Organization check:', { org, orgError })

    if (orgError) {
      console.error('Join Action - Organization error:', orgError)
      return { error: 'Organization not found or not active' }
    }

    if (!org) {
      console.error('Join Action - Organization not found')
      return { error: 'Organization not found or not active' }
    }

    // Check if user already has an organization
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      console.error('Join Action - Profile error:', profileError)
      return { error: 'Failed to fetch user profile' }
    }

    if (profile?.org_id) {
      console.error('Join Action - User already has an organization')
      return { error: 'You are already a member of an organization' }
    }

    // Update profile with organization ID using service client
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ 
        org_id: organizationId,
        role: 'employee',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Join Action - Update error:', updateError)
      return { error: 'Failed to update profile' }
    }

    console.log('Join Action - Success:', { organizationName: org.name })
    return { 
      success: true,
      organizationName: org.name,
      message: `Successfully joined ${org.name}`
    }
  } catch (error) {
    console.error('Join Action - Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
} 