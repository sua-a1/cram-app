'use server'

import { z } from 'zod'
import { updatePassword } from '@/lib/server/auth-logic'
import { redirect } from 'next/navigation'

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function updatePasswordAction(formData: FormData) {
  const validatedFields = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid form data. Please check your input.',
      issues: validatedFields.error.issues,
    }
  }

  const { password } = validatedFields.data

  try {
    const result = await updatePassword({ password })

    if (result.error) {
      return { error: result.error }
    }

    redirect('/signin')
  } catch (error) {
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 