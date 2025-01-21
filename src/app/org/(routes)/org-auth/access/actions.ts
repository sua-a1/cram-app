'use server'

import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function joinAction(formData: FormData) {
  const organizationId = formData.get('organizationId')?.toString()
  console.log('Join Action - Start', { organizationId })
  
  if (!organizationId) {
    console.error('Join Action - No organization ID provided')
    return { error: new Error('No organization ID provided') }
  }

  try {
    // Get cookie store and create clients
    const cookieStore = cookies()
    const supabase = await createServerSupabaseClient()
    const serviceClient = createServiceClient()

    // Get current session to identify the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Join Action - Session check:', { session, sessionError })
    
    if (sessionError || !session?.user) {
      console.error('Join Action - Session error:', sessionError)
      return { error: sessionError || new Error('No active session') }
    }

    // Get the current user's profile specifically
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      console.error('Join Action - Profile error:', profileError)
      return { error: profileError }
    }

    console.log('Join Action - Profile found:', profile)

    // Update profile with organization ID and change role to employee
    const { data: updatedProfile, error: updateError } = await serviceClient
      .from('profiles')
      .update({ 
        org_id: organizationId,
        role: 'employee' // Change role from customer to employee when joining org
      })
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Join Action - Update error:', updateError)
      return { error: updateError }
    }

    console.log('Join Action - Success:', { updatedProfile })
    return { profile: updatedProfile }
  } catch (error) {
    console.error('Join Action - Unexpected error:', error)
    return { error }
  }
} 