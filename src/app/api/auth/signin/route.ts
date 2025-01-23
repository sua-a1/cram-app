import { createRouteHandlerClient } from '@/lib/supabase'
import { type SignInCredentials } from '@/types/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}) satisfies z.ZodType<SignInCredentials>

// Ensure this is treated as an API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: Request) {
  try {
    // Parse JSON data
    const data = await request.json()
    console.log('Received data:', {
      email: data.email ? '(provided)' : '(missing)',
      password: data.password ? '(provided)' : '(missing)',
    })

    const validatedFields = signInSchema.safeParse(data)

    if (!validatedFields.success) {
      console.error('Validation error:', validatedFields.error)
      return NextResponse.json(
        {
          error: 'Invalid form data. Please check your input.',
          details: validatedFields.error.errors,
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient(request)

    console.log('Attempting sign in...')
    // Sign in with password
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    })

    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      )
    }

    if (!authData.user || !authData.session) {
      console.error('No user or session after sign in')
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('Sign in successful, fetching profile...')
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    console.log('Profile fetched successfully')
    const response = NextResponse.json({
      success: true,
      user: {
        ...authData.user,
        role: profile.role,
        org_id: profile.org_id
      }
    })

    return response
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      details: error instanceof Error ? error.message : undefined,
    }, { status: 500 })
  }
} 