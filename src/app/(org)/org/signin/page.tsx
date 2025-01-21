import { Metadata } from 'next'
import { OrgSignInForm } from '@/components/org/signin-form'

export const metadata: Metadata = {
  title: 'Organization Sign In - Cram Support',
  description: 'Sign in to your organization account',
}

export default function OrgSignInPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to your organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your organization credentials to access your support dashboard
        </p>
      </div>
      <OrgSignInForm />
    </div>
  )
} 