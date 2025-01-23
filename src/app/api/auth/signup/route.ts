import { createServerClient } from '@/lib/supabase'
import { SignUpCredentials } from '@/types/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as z from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.literal('customer'),
}) satisfies z.ZodType<SignUpCredentials>

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      display_name: formData.get('display_name'),
      role: formData.get('role'),
    }

    // Validate form data
    const validatedData = signUpSchema.parse(data)

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          display_name: validatedData.display_name,
          role: validatedData.role,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user?.id,
        email: validatedData.email,
        display_name: validatedData.display_name,
        role: validatedData.role,
      })

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Check your email for the confirmation link' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Sign up error:', error)
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten()
      const firstError = Object.values(fieldErrors)[0]?.[0]
      return NextResponse.json(
        { error: firstError || 'Invalid form data' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 