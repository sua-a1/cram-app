'use server'

import { createServerClient, createServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import * as z from 'zod'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  redirect: z.string().optional(),
})

export async function signInAction(formData: FormData) {
  const supabase = createServerClient()
  const serviceClient = createServiceClient()
  
  try {
    // Validate form data
    const validatedData = signInSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: formData.get('redirect'),
    })

    // Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return { error: 'Invalid email or password' }
    }

    if (!signInData.user) {
      console.error('No user data after sign in')
      return { error: 'Failed to sign in' }
    }

    // Get user profile to check role and organization
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, org_id')
      .eq('user_id', signInData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return { error: 'Failed to fetch user profile' }
    }

    // Verify that this is an organization user
    if (!profile.org_id || !['admin', 'employee'].includes(profile.role)) {
      await supabase.auth.signOut()
      return { error: 'Invalid organization account' }
    }

    // Redirect based on role and organization
    const redirectPath = validatedData.redirect || `/org/${profile.org_id}/${profile.role === 'admin' ? 'admin' : 'dashboard'}`
    redirect(redirectPath)

  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten()
      const firstError = Object.values(fieldErrors)[0]?.[0]
      return { error: firstError || 'Invalid form data' }
    }
    return { error: 'An unexpected error occurred' }
  }
} 