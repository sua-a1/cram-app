'use server'

import { createServerSupabaseClient } from '@/lib/server/supabase'
import { redirect } from 'next/navigation'

export async function updatePasswordAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: { message: 'Passwords do not match' } }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error }
  }

  redirect('/org/org-auth/signin')
} 