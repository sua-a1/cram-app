import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgUpdatePasswordForm } from '@/components/org/update-password-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Update Password - Organization',
  description: 'Update your organization account password',
}

export default async function OrgUpdatePasswordPage() {
  const cookieStore = cookies()
  const supabase = createClient()
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/org/org-auth/signin')
  }

  return (
    <AuthLayout>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Update Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new organization account password.
          </p>
        </div>
        <OrgUpdatePasswordForm />
      </div>
    </AuthLayout>
  )
} 