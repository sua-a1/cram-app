'use server'

import { createServerSupabaseClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'

export async function resetPasswordAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/org/org-auth/update-password`,
  })

  if (error) {
    return { error }
  }

  return { success: true }
} 