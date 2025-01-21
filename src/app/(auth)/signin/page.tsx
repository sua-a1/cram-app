import { Metadata } from 'next'
import { SignInForm } from '@/components/auth/signin-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Sign In - Cram Support',
  description: 'Sign in to your account',
}

export default function SignInPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to sign in
          </p>
        </div>
        <SignInForm />
      </div>
    </AuthLayout>
  )
} 