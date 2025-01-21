import Link from 'next/link'
import { Metadata } from 'next'
import { OrgSignUpForm } from '@/components/org/signup-form'

export const metadata: Metadata = {
  title: 'Sign Up - Organization',
  description: 'Create your organization account',
}

export default function SignUpPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Organization Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to create your organization account
        </p>
      </div>
      <OrgSignUpForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
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