'use server'

import { createClient } from '@/lib/server/auth-logic'

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password')

  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' }
  }

  try {
    const supabase = await createClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError)
      return { error: 'Please sign in again' }
    }

    // Check user role from session claims
    const role = session.user.user_metadata?.role
    if (!role || (role !== 'admin' && role !== 'employee')) {
      return { error: 'Invalid organization account' }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('Error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
} 