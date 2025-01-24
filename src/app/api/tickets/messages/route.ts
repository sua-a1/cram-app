import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/server/supabase'
import { getSession } from '@/lib/server/auth-logic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { ticketId, content } = await request.json()
    if (!ticketId || !content) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const supabase = createServiceClient()

    // Get user profile for author details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new NextResponse('Failed to fetch user profile', { status: 500 })
    }

    // Insert the message and return the created message data
    const { data: message, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        body: content,
        author_id: session.user.id,
        author_name: profile.display_name,
        author_email: session.user.email,
        author_role: 'customer',
        message_type: 'public',
        source: 'web'
      })
      .select('*, author:profiles(display_name, role)')
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return new NextResponse('Failed to create message', { status: 500 })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tickets/messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}