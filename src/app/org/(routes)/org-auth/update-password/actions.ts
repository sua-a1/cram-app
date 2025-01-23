'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
})

export type UpdatePasswordResponse = {
  error?: string
  success?: string
}

export async function updatePasswordAction(formData: FormData): Promise<UpdatePasswordResponse> {
  const validatedFields = updatePasswordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid password format.',
    }
  }

  const { password } = validatedFields.data
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        error: 'No active session found. Please try the reset link again.',
      }
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      return { error: error.message }
    }

    // Clear the PKCE verifier cookie
    cookieStore.delete('pkce_verifier')

    return {
      success: 'Password updated successfully.',
    }
  } catch (error) {
    console.error('Password update error:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 