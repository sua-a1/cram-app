'use server'

import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ResetPasswordResponse = {
  error?: string
  success?: string
}

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResponse> {
  const email = formData.get('email')
  
  try {
    const { email: validatedEmail } = resetPasswordSchema.parse({ email })
    
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
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    console.log('Attempting to send reset password email...')
    const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      console.error('Reset password error:', error)
      return { error: error.message }
    }

    console.log('Reset password email sent successfully')
    return { success: 'Check your email for the password reset link' }
  } catch (error) {
    console.error('Unexpected error in reset password:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'An unexpected error occurred' }
  }
} 