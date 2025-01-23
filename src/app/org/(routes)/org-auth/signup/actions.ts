'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  role: z.enum(['admin', 'employee'], {
    required_error: 'Please select a role',
  }),
})

export async function signUpAction(formData: FormData) {
  console.log('OrgSignUpAction received form data:', {
    email: formData.get('email'),
    displayName: formData.get('displayName'),
    role: formData.get('role'),
    hasPassword: !!formData.get('password'),
  })

  try {
    const validatedFields = signUpSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      displayName: formData.get('displayName'),
      role: formData.get('role'),
    })

    if (!validatedFields.success) {
      console.error('Validation error:', validatedFields.error)
      return {
        error: 'Invalid form data',
        details: validatedFields.error.errors,
      }
    }

    // Create Supabase client
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

    console.log('Attempting org signup...')
    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      options: {
        data: {
          display_name: validatedFields.data.displayName,
          role: validatedFields.data.role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/org/org-auth/callback`,
      },
    })

    if (signUpError) {
      console.error('Org signup error:', signUpError)
      return { error: signUpError.message }
    }

    if (!authData.user) {
      console.error('No user data after org signup')
      return { error: 'Failed to create user' }
    }

    console.log('Creating org user profile...')
    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: validatedFields.data.email,
        display_name: validatedFields.data.displayName,
        role: validatedFields.data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Org profile creation error:', profileError)
      return { error: 'Failed to create user profile' }
    }

    console.log('Org signup successful')
    return { 
      success: true,
      message: 'Account created successfully. Please check your email for verification.',
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 