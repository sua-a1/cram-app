import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export function createBrowserClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

export function createClient(): SupabaseClient<Database> {
  return createBrowserClient()
}

export async function getUser() {
  try {
    const { data: { session }, error: sessionError } = await createBrowserClient().auth.getSession()
    if (sessionError || !session) {
      return null
    }

    const { data: { user }, error: userError } = await createBrowserClient().auth.getUser()
    if (userError || !user) {
      return null
    }

    // Pass the user ID to the profile endpoint
    const response = await fetch(`/api/profile?userId=${user.id}`)
    if (!response.ok) {
      console.error('Error fetching profile:', await response.text())
      return user
    }

    const profile = await response.json()
    
    return {
      ...user,
      profile
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Auth helpers
export const auth = {
  signUp: async ({ email, password, name }: { email: string; password: string; name: string }) => {
    const { data, error } = await createBrowserClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })
    return { data, error }
  },

  signIn: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await createBrowserClient().auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await createBrowserClient().auth.signOut()
    return { error }
  },

  getSession: async () => {
    const { data: { session }, error } = await createBrowserClient().auth.getSession()
    return { session, error }
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return createBrowserClient().auth.onAuthStateChange(callback)
  }
} 