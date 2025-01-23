import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no-code`)
  }

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
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !session) {
      console.error('Auth callback error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback-failed`)
    }

    // If this is a password reset flow, redirect to update password
    if (next?.includes('update-password')) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }

    const user = session.user

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError?.code === 'PGRST116' || !profile) {
      // Create profile if it doesn't exist - matching schema exactly
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
        console.error('Error creating profile:', createError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-creation-failed`)
      }
    } else if (profileError) {
      console.error('Unexpected profile error:', profileError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=profile-error`)
    }

    // Redirect to customer dashboard
    return NextResponse.redirect(`${requestUrl.origin}/customer`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=unexpected`)
  }
} 