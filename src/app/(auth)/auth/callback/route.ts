'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const cookieStore = cookies()
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({
                name,
                value,
                ...options
              })
            },
            remove(name: string, options: any) {
              cookieStore.delete(name)
            },
          },
        }
      )

      // Exchange code for session
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError || !session?.user) {
        console.error('Auth callback error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback-failed`)
      }

      const user = session.user
      console.log('User from session:', user)

      // Get user's profile to check if it exists
      const { data: profile, error: profileError } = await supabase
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('Creating customer profile with data:', profileData)

        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData])

        if (createError) {
          console.error('Error creating customer profile:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-creation-failed`)
        }

        console.log('Created new customer profile')
      } else if (profileError) {
        console.error('Unexpected customer profile error:', profileError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-error`)
      }

      // Redirect to dashboard after successful auth and profile creation
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }

    // If no code, redirect to signin
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no-code`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=unexpected`)
  }
} 