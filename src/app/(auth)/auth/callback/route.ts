'use server'

import { createClient } from '@/lib/server/auth-logic'
import { createServiceClient } from '@/lib/server/supabase'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const supabase = await createClient()
      const serviceClient = await createServiceClient()
      
      // Exchange code for session
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError || !session?.user) {
        console.error('Auth callback error:', exchangeError)
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=callback-failed`)
      }

      const user = session.user
      console.log('User from session:', user)

      // Get user's profile to check if it exists
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('Profile check result:', { profile, error: profileError })

      if (profileError?.code === 'PGRST116' || !profile) {
        console.log('Profile not found, creating new customer profile for user:', user.id)

        // Create profile if it doesn't exist
        const profileData = {
          user_id: user.id,
          email: user.email!,
          display_name: user.user_metadata.display_name || user.email!.split('@')[0],
          role: 'customer',
        }

        console.log('Creating customer profile with data:', profileData)

        const { error: createError } = await serviceClient
          .from('profiles')
          .insert([profileData])

        if (createError) {
          console.error('Error creating customer profile:', createError)
          return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=profile-creation-failed`)
        }

        console.log('Created new customer profile')
      } else if (profileError) {
        console.error('Unexpected customer profile error:', profileError)
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=profile-error`)
      }

      // Redirect to dashboard after successful auth and profile creation
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
    }

    // If no code, redirect to signin
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=no-code`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=unexpected`)
  }
} 