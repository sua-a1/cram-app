'use server'

import { createClient, createAdminClient } from '@/lib/server/auth-logic'
import { redirect } from 'next/navigation'

export async function signInAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // First sign out to ensure clean state
    await supabase.auth.signOut()

    // Attempt to sign in
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (error || !user) {
      console.error('Sign in error:', error)
      return { error: error?.message || 'Failed to sign in' }
    }

    // Get user role and verify it's an organization role using admin client
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, org_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      await supabase.auth.signOut()
      return { error: 'Failed to fetch user profile' }
    }

    const role = profile?.role

    if (!role || !['admin', 'employee'].includes(role)) {
      await supabase.auth.signOut()
      return { error: 'Invalid organization account. Please use a customer account instead.' }
    }

    // For organization users, we require an org_id
    if (!profile.org_id) {
      await supabase.auth.signOut()
      return { error: 'No organization associated with this account.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
} 