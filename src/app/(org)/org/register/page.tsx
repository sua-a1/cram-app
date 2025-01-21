import type { Metadata } from 'next'
import { RegisterForm } from '@/components/org/register-form'

export const metadata: Metadata = {
  title: 'Register Organization - Cram Support',
  description: 'Register your organization for Cram Support',
}

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Register Organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Create an organization account to manage your support team
        </p>
      </div>
      <RegisterForm />
    </div>
  )
} 