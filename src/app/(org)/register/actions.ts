'use server'

import { createClient } from '@/lib/server/auth-logic'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type Organization = Database['public']['Tables']['organizations']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export async function registerOrganization(formData: FormData) {
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('No authenticated user:', sessionError)
      return { error: 'You must be signed in to register an organization' }
    }

    // Get user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return { error: 'Failed to verify user role' }
    }

    // Only admins can create organizations
    if (profile.role !== 'admin') {
      return { error: 'Only admin users can register organizations' }
    }

    const orgName = formData.get('orgName') as string
    const domain = formData.get('domain') as string

    // Validate required fields
    if (!orgName) {
      return { error: 'Organization name is required' }
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert<Database['public']['Tables']['organizations']['Insert']>([
        {
          name: orgName,
          domain: domain || null,
          status: 'active',
        },
      ])
      .select()
      .single()

    if (orgError || !organization) {
      console.error('Error creating organization:', orgError)
      return { error: 'Failed to create organization' }
    }

    // Update user's profile with org_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update<Database['public']['Tables']['profiles']['Update']>({ 
        org_id: organization.id 
      })
      .eq('user_id', session.user.id)

    if (updateError) {
      // Rollback organization creation
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)
      
      console.error('Error updating profile:', updateError)
      return { error: 'Failed to update profile with organization' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in registerOrganization:', error)
    return { error: 'An unexpected error occurred' }
  }
} 