'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerAction(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const domain = formData.get('domain') as string

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name,
        domain: domain || null,
        status: 'active'  // Default status as defined in schema
      }])
      .select()
      .single()

    if (orgError) throw orgError
    if (!org) throw new Error('Failed to create organization')

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        org_id: org.id,
        role: 'admin',
        display_name: session.user.email?.split('@')[0] || 'Admin'
      })
      .eq('user_id', session.user.id)

    if (profileError) throw profileError

    revalidatePath('/org/dashboard')
    return { success: true, organizationId: org.id }
  } catch (error) {
    console.error('Registration error:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to create organization'
    }
  }
} 