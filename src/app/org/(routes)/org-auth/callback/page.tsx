import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/server/supabase'
import { cookies } from 'next/headers'
import { type EmailOtpType } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Auth Callback',
  description: 'Processing authentication...',
}

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: Props) {
  const token = searchParams.token as string | undefined
  const type = searchParams.type as EmailOtpType | undefined

  try {
    console.log('Received searchParams:', { token, type })
    const cookieStore = await cookies()
    const serviceClient = createServiceClient()
    const supabase = await createServerSupabaseClient()

    // Get the session - Supabase should handle the token verification automatically
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check result:', { session, error: sessionError })
    
    if (sessionError || !session?.user) {
      console.error('Auth callback error:', sessionError)
      redirect('/org/org-auth/signin?error=callback-failed')
    }

    const user = session.user
    console.log('User from session:', user)

    // Get user's profile to check organization
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    console.log('Profile check result:', { profile, error: profileError })

    if (profileError?.code === 'PGRST116' || !profile) {
      console.log('Profile not found, creating new profile for user:', user.id)

      // Create profile if it doesn't exist - matching schema exactly
      const profileData = {
        user_id: user.id,
        email: user.email!,
        display_name: user.user_metadata.display_name || user.email!.split('@')[0],
        role: user.user_metadata.role || 'employee',
        org_id: null // Will be set when joining an org
      }

      console.log('Creating profile with data:', profileData)

      const { data: newProfile, error: createError } = await serviceClient
        .from('profiles')
        .insert([profileData])
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        redirect('/org/org-auth/signin?error=profile-creation-failed')
      }

      console.log('Created new profile:', newProfile)
      // Redirect to access page to join/create org
      redirect('/org/org-auth/access')
    } else if (profileError) {
      console.error('Unexpected profile error:', profileError)
      redirect('/org/org-auth/signin?error=profile-error')
    }

    // If user has no org_id, redirect to access page
    if (!profile?.org_id) {
      console.log('No org_id, redirecting to access')
      redirect('/org/org-auth/access')
    }

    // Redirect to the appropriate dashboard based on role
    const dashboardPath = profile.role === 'admin'
      ? `/org/${profile.org_id}/admin`
      : `/org/${profile.org_id}/employee`

    redirect(dashboardPath)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    redirect('/org/org-auth/signin?error=unexpected')
  }
} 