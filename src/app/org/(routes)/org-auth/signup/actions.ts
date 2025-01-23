'use server'

import { createServerClient, createServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import * as z from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'employee']),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

export async function signUpAction(formData: FormData) {
  const serviceClient = createServiceClient()
  const supabase = createServerClient()
  
  try {
    // Validate form data
    const validatedData = signUpSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      displayName: formData.get('displayName'),
    })

    // Create the auth user with admin client
    const { data: signUpData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        role: validatedData.role,
        display_name: validatedData.displayName,
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

    // Create profile without organization
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        user_id: signUpData.user.id,
        display_name: validatedData.displayName,
        role: validatedData.role,
        email: validatedData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Clean up the user if profile creation fails
      await serviceClient.auth.admin.deleteUser(signUpData.user.id)
      return { error: 'Failed to create profile' }
    }

    // Sign in the user immediately since email is auto-confirmed
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (signInError) {
      console.error('Sign in error after signup:', signInError)
      return { 
        success: true,
        message: 'Account created successfully, but automatic sign-in failed. Please sign in manually.',
      }
    }

    return { 
      success: true,
      message: 'Account created successfully. You can now join or create an organization.',
    }

  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten()
      const firstError = Object.values(fieldErrors)[0]?.[0]
      return { error: firstError || 'Invalid form data' }
    }
    return { error: 'An unexpected error occurred' }
  }
} 