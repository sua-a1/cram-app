'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'
    
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

      // Get stored PKCE verifier if it exists
      const pkceVerifier = cookieStore.get('pkce_verifier')?.value

      // Exchange code for session
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError || !session?.user) {
        console.error('Auth callback error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback-failed`)
      }

      // Clear PKCE verifier if it exists
      if (pkceVerifier) {
        cookieStore.delete('pkce_verifier')
      }

      const user = session.user

      // If this is a password reset flow, redirect to update password
      if (next.includes('update-password')) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }

      // For normal sign in flow, check/create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError?.code === 'PGRST116' || !profile) {
        // Create profile if it doesn't exist
        const profileData = {
          user_id: user.id,
          email: user.email!,
          display_name: user.user_metadata.display_name || user.email!.split('@')[0],
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData])

        if (createError) {
          console.error('Error creating customer profile:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-creation-failed`)
        }
      } else if (profileError) {
        console.error('Unexpected customer profile error:', profileError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-error`)
      }

      // Redirect to the next page or dashboard
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }

    // If no code, redirect to signin
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no-code`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=unexpected`)
  }
} 