'use server'

import { createServiceClient } from '@/lib/server/supabase'

export async function getProfile(userId: string) {
  try {
    const serviceClient = createServiceClient()
    
    const { data: profile, error } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return { profile: null, error: error.message }
    }

    return { profile, error: null }
  } catch (error) {
    console.error('Unexpected error in getProfile:', error)
    return { profile: null, error: 'Failed to fetch profile' }
  }
} 