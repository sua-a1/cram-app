import Link from 'next/link'
import { Metadata } from 'next'
import { OrgResetPasswordForm } from '@/components/org/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password - Organization',
  description: 'Reset your organization account password',
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to reset your organization account password
        </p>
      </div>
      <OrgResetPasswordForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link 
          href="/org/org-auth/signin"
          className="hover:text-brand underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
} 