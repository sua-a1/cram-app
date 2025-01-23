import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next')
    
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
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError || !session?.user) {
        console.error('Auth callback error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/signin?error=callback-failed`)
      }

      // If this is a password reset flow, redirect to update password
      if (next?.includes('update-password')) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }

      const user = session.user

      // Get user's profile to check organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

      if (profileError?.code === 'PGRST116' || !profile) {
        // Create profile if it doesn't exist - matching schema exactly
        const profileData = {
          user_id: user.id,
          email: user.email!,
          display_name: user.user_metadata.display_name || user.email!.split('@')[0],
          role: user.user_metadata.role || 'employee',
          org_id: null, // Will be set when joining an org
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData])

        if (createError) {
          console.error('Error creating profile:', createError)
          return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/signin?error=profile-creation-failed`)
        }

        // Redirect to access page to join/create org
        return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/access`)
      } else if (profileError) {
        console.error('Unexpected profile error:', profileError)
        return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/signin?error=profile-error`)
      }

      // If user has no org_id, redirect to access page
      if (!profile?.org_id) {
        return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/access`)
      }

      // For normal sign in flow, redirect to the appropriate dashboard based on role
      const dashboardPath = profile.role === 'admin'
        ? `/org/${profile.org_id}/admin`
        : `/org/${profile.org_id}/employee`

      return NextResponse.redirect(`${requestUrl.origin}${dashboardPath}`)
    }

    // If no code, redirect to signin
    return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/signin?error=no-code`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/org/org-auth/signin?error=unexpected`)
  }
} 