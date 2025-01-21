'use server'

import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  const serviceClient = createServiceClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'admin' | 'employee'
  const displayName = formData.get('displayName') as string
  const orgId = formData.get('orgId') as string

  try {
    // Create the auth user
    const { data: signUpData, error: signUpError } = await serviceClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          display_name: displayName,
        }
      }
    })

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      return { error: signUpError.message }
    }

    if (!signUpData.user) {
      console.error('No user data after sign up')
      return { error: 'Failed to create user' }
    }

    // Create profile immediately since email confirmation is turned off
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        user_id: signUpData.user.id,
        display_name: displayName,
        role: role,
        org_id: orgId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { error: 'Failed to create profile' }
    }

    // Sign in the user immediately since email confirmation is off
    const { error: signInError } = await serviceClient.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Sign in error after signup:', signInError)
      return { error: 'Account created but failed to sign in' }
    }

    return { success: true }

  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    return { error: 'An unexpected error occurred' }
  }
} 