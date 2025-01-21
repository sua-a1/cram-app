'use server'

import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { cookies } from 'next/headers'

export async function signInAction(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()
    const serviceClient = createServiceClient()
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnUrl = formData.get('returnUrl') as string | null

    // Sign in and get session
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return { error: signInError }
    }

    if (!data?.user) {
      return { error: { message: 'No user data returned' } }
    }

    // Get user's profile to check organization
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return { error: { message: 'Failed to fetch user profile' } }
    }

    // If no org_id, return access page URL
    if (!profile?.org_id) {
      return { redirectTo: '/org/org-auth/access' }
    }

    // If returnUrl is provided and valid, use it
    if (returnUrl && returnUrl.startsWith('/org/')) {
      return { redirectTo: returnUrl }
    }

    // Otherwise return dashboard URL with query params
    return { 
      redirectTo: `/org/dashboard?userId=${data.user.id}&orgId=${profile.org_id}`
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: { message: 'An unexpected error occurred' } }
  }
} 