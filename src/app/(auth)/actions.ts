'use server'

import { createClient, deleteAccount } from '@/lib/server/auth-logic'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Error getting user:', error)
      return null
    }
    
    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('Error fetching user role:', profileError)
      return user
    }
    
    return {
      ...user,
      role: profile?.role
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error('Failed to sign out')
    }
    
    redirect('/auth/signin')
  } catch (error) {
    console.error('Error in signOut:', error)
    throw error
  }
}

export async function resetPassword(data: { email: string }) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in resetPassword:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updatePassword(data: { password: string, code: string }) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in updatePassword:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function handleSignIn(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (error || !user) {
      return { error: error?.message || 'Failed to sign in' }
    }

    // Get user role and redirect accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = profile?.role || 'customer'
    
    switch (role) {
      case 'admin':
        redirect('/admin/dashboard')
      case 'employee':
        redirect('/employee/dashboard')
      default:
        redirect('/dashboard')
    }
  } catch (error) {
    console.error('Error in handleSignIn:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteAccountAction() {
  try {
    const result = await deleteAccount()
    
    if (result.error) {
      return { error: result.error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in deleteAccountAction:', error)
    return { error: 'An unexpected error occurred' }
  }
} 