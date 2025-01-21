'use server'

import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { type Database } from '@/types/supabase'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import {
  type AuthResponse,
  type SignUpCredentials,
  type SignInCredentials,
  type ResetPasswordCredentials,
  type UpdatePasswordCredentials,
  type UpdateProfileCredentials,
  type UserRole,
  type AuthUser,
  type AuthSession,
} from '@/types/auth'

// Transform Supabase User to AuthUser
async function transformUser(user: User | null, supabase: SupabaseClient<Database>): Promise<AuthUser | null> {
  if (!user) return null

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('user_id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role || user.user_metadata.role || 'customer') as UserRole,
    display_name: profile?.display_name || user.email!.split('@')[0],
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at,
  }
}

// Transform Supabase Session to AuthSession
async function transformSession(session: Session | null, supabase: SupabaseClient<Database>): Promise<AuthSession | null> {
  if (!session) return null
  return {
    user: await transformUser(session.user, supabase),
    expires_at: session.expires_at!,
  }
}

// Create a single instance of the Supabase client for server-side operations
export async function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production'
          })
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.delete(name)
        },
      },
    }
  )
}

// Create a single instance of the Supabase admin client for privileged operations
async function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production'
          })
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.delete(name)
        },
      },
    }
  )
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  try {
    // Get authenticated user data from Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    // Get session for additional context
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }

    return transformUser(user, supabase)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function signUp({ email, password, role = 'customer', display_name }: SignUpCredentials): Promise<AuthResponse> {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  
  try {
    const { data: { user, session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) throw error

    // Insert into profiles table with role and email using admin client
    if (user) {
      // Check if profile already exists
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert({
            display_name: display_name || email.split('@')[0],
            role,
            user_id: user.id,
            email: email,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw profileError
        }
      }
    }

    return { 
      user: await transformUser(user, supabase),
      session: await transformSession(session, supabase)
    }
  } catch (error: any) {
    return { user: null, session: null, error: error.message }
  }
}

export async function signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
  const supabase = await createClient()
  
  try {
    // First sign out to ensure clean state
    await supabase.auth.signOut()

    // Attempt to sign in
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    if (!user || !session) {
      throw new Error('No user or session after sign in')
    }

    return { 
      user: await transformUser(user, supabase),
      session: await transformSession(session, supabase)
    }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { 
      user: null, 
      session: null, 
      error: error.message || 'Invalid login credentials' 
    }
  }
}

export async function signOut(): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return {}
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function resetPassword({ email }: ResetPasswordCredentials): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
    })
    if (error) throw error
    return {}
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updatePassword({ 
  password, 
  code 
}: UpdatePasswordCredentials & { code?: string }): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    if (!session && code) {
      // If no session but we have a code, try to exchange it for a session
      const { data: { session: resetSession }, error: resetError } = await supabase.auth.exchangeCodeForSession(code)
      if (resetError) throw resetError
      if (!resetSession) throw new Error('No session available')
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) throw updateError

    // Sign out after password update to ensure a clean state
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError

    return {}
  } catch (error: any) {
    console.error('Error updating password:', error)
    return { error: error.message || 'Failed to update password' }
  }
}

export async function updateProfile({ display_name, email }: UpdateProfileCredentials): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    const session = await getSession()
    if (!session) throw new Error('Not authenticated')

    // If email is being updated, update auth.users first
    if (email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) throw emailError
    }

    // Update profile
    const updates: { display_name?: string; email?: string } = {}
    if (display_name) updates.display_name = display_name
    if (email) updates.email = email

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', session.user.id)

    if (profileError) throw profileError

    return {}
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getSession() {
  const supabase = await createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    return null
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data?.role as UserRole | null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/signin')
  }
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  const role = await getUserRole(session.user.id)
  
  if (!role || !allowedRoles.includes(role)) {
    redirect('/unauthorized')
  }
  
  return { session, role }
}