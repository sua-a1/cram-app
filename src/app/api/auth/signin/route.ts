import { createServerClient } from '@/lib/supabase'
import { type SignInCredentials } from '@/types/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}) satisfies z.ZodType<SignInCredentials>

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const validatedFields = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your input.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase.auth.signInWithPassword(validatedFields.data)

    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 