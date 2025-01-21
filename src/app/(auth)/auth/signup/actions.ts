'use server'

import { z } from 'zod'
import { signUp } from '@/lib/server/auth-logic'
import { redirect } from 'next/navigation'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
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
    })

    if (!validatedFields.success) {
      console.error('Validation error:', validatedFields.error.issues)
      return {
        error: 'Invalid form data. Please check your input.',
        issues: validatedFields.error.issues,
      }
    }

    const { email, password, display_name } = validatedFields.data

    const result = await signUp({ email, password, display_name })
    
    if (result.error) {
      return { error: result.error }
    }

    // Return success before redirecting
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in signUpAction:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 