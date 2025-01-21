'use server'

import { NextResponse } from 'next/server'
import { signOut } from '@/lib/server/auth-logic'

export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error signing out:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
} 