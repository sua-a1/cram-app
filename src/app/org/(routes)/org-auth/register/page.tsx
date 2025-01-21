import { Metadata } from 'next'
import { OrgRegisterForm } from '@/components/org/register-form'

export const metadata: Metadata = {
  title: 'Register Organization',
  description: 'Register your organization',
}

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Register Organization
        </h1>
        <p className="text-sm text-muted-foreground">
          Create or join an organization
        </p>
      </div>
      <OrgRegisterForm />
    </div>
  )
} 