'use server'

import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  const serviceClient = createServiceClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'admin' | 'employee'
  const displayName = formData.get('displayName') as string

  try {
    // Create the auth user
    const { data: signUpData, error: signUpError } = await serviceClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/org/org-auth/callback`,
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

    // Instead of creating the profile now, we'll create it when the user confirms their email
    // and hits the callback endpoint. For now, just return success.
    return { 
      success: true,
      message: 'Please check your email to verify your account. You will be able to access the platform after verification.'
    }

  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    return { error: 'An unexpected error occurred' }
  }
} 