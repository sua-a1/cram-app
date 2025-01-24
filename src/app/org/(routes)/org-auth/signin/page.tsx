import Link from 'next/link'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OrgSignInForm } from '@/components/org/signin-form'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Sign In - Organization',
  description: 'Sign in to your organization account',
}

export default async function SignInPage() {
  // Check if user is already signed in
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/org/dashboard')
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your organization
        </p>
      </div>
      <OrgSignInForm />
      <div className="px-8 text-center text-sm space-y-2">
        <p className="text-muted-foreground">
          <Link 
            href="/org/org-auth/reset-password"
            className="hover:text-brand underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-muted-foreground">
          Need an organization account?{' '}
          <Link 
            href="/org/org-auth/signup"
            className="hover:text-brand underline underline-offset-4"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
} 