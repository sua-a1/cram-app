'use server'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/auth-logic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json({ user: null })
  }
} 