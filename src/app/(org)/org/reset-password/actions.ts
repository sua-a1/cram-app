'use server'

import { createClient, createAdminClient } from '@/lib/server/auth-logic'

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return { error: 'Email is required' }
  }

  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Get user by email
    const { data: { users }, error: userError } = await adminClient.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (userError) {
      console.error('Error getting user:', userError)
      return { error: 'Something went wrong. Please try again.' }
    }

    if (!user) {
      return { error: 'No account found with this email' }
    }

    // Get user role from profiles table using admin client
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting user role:', profileError)
      return { error: 'Something went wrong. Please try again.' }
    }

    // Check if user is an organization member
    if (!profile || (profile.role !== 'admin' && profile.role !== 'employee')) {
      return { error: 'Invalid organization email' }
    }

    // Send reset password email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/org/update-password`,
    })

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