import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Sign Up - Cram Support',
  description: 'Create a new account',
}

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </AuthLayout>
  )
} 