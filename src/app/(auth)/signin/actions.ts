'use server'

import { z } from 'zod'
import { signIn } from '@/lib/server/auth-logic'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export async function signInAction(formData: FormData) {
  try {
    const validatedFields = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      return {
        error: 'Invalid form data. Please check your input.',
        issues: validatedFields.error.issues,
      }
    }

    const { email, password } = validatedFields.data
    const result = await signIn({ email, password })

    if (result.error) {
      console.error('Sign in error:', result.error)
      return { error: result.error }
    }

    // Return success instead of redirecting
    return { success: true }
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 