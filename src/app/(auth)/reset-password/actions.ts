'use server'

import { z } from 'zod'
import { resetPassword } from '@/lib/server/auth-logic'
import { redirect } from 'next/navigation'

const resetPasswordSchema = z.object({
  email: z.string().email(),
})

export async function resetPasswordAction(formData: FormData) {
  const validatedFields = resetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid email address.',
      issues: validatedFields.error.issues,
    }
  }

  const { email } = validatedFields.data

  try {
    const result = await resetPassword({ email })

    if (result.error) {
      return { error: result.error }
    }

    return {
      success: 'If an account exists with this email, you will receive a password reset link.',
    }
  } catch (error) {
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 