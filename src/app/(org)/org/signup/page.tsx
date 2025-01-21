import { Metadata } from 'next'
import { OrgSignUpForm } from '@/components/org/signup-form'

export const metadata: Metadata = {
  title: 'Organization Sign Up - Cram Support',
  description: 'Register your organization for Cram Support',
}

export default function OrgSignUpPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Register your organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Create an organization account to manage your support team
        </p>
      </div>
      <OrgSignUpForm />
    </div>
  )
} 