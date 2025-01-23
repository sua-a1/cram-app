'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ResetPasswordResponse = {
  error?: string
  success?: string
}

// Generate PKCE verifier
function generatePKCEVerifier(): string {
  return randomBytes(32).toString('base64url')
}

// Generate PKCE challenge
function generatePKCEChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResponse> {
  const validatedFields = resetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid email address.',
    }
  }

  const { email } = validatedFields.data
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    // Generate PKCE verifier and challenge
    const pkceVerifier = generatePKCEVerifier()
    const pkceChallenge = generatePKCEChallenge(pkceVerifier)

    // Store the verifier in a secure cookie
    cookieStore.set('pkce_verifier', pkceVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })

    // Get the site URL from environment or default to localhost
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return {
      success: 'If an account exists with this email, you will receive a password reset link.',
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
} 