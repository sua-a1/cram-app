import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export const metadata: Metadata = {
  title: 'Update Password - Cram Support',
  description: 'Update your password',
}

export default async function UpdatePasswordPage() {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] p-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  )
} 