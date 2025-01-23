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
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.literal('customer'),
})

export async function signUpAction(formData: FormData) {
  console.log('SignUpAction received form data:', {
    email: formData.get('email'),
    display_name: formData.get('display_name'),
    hasPassword: !!formData.get('password'),
  })

  try {
    const validatedFields = signUpSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      display_name: formData.get('display_name'),
      role: 'customer',
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

    console.log('Attempting signup...')
    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      options: {
        data: {
          display_name: validatedFields.data.display_name,
          role: validatedFields.data.role,
        },
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      return { error: signUpError.message }
    }

    if (!authData.user) {
      console.error('No user data after signup')
      return { error: 'Failed to create user' }
    }

    console.log('Creating user profile...')
    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: validatedFields.data.email,
        display_name: validatedFields.data.display_name,
        role: validatedFields.data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { error: 'Failed to create user profile' }
    }

    console.log('Signup successful')
    return { 
      success: true,
      message: 'Check your email for the confirmation link'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 