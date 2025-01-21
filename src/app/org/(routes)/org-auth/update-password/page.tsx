import { Metadata } from 'next'
import { OrgUpdatePasswordForm } from '@/components/org/update-password-form'

export const metadata: Metadata = {
  title: 'Update Password - Organization',
  description: 'Update your organization account password',
}

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new organization account password
        </p>
      </div>
      <OrgUpdatePasswordForm />
    </div>
  )
} 