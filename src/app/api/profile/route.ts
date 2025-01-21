import { createServiceClient } from '@/lib/server/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create service client
    const supabase = createServiceClient()

    // Get user profile using service role client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select()
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in profile route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 