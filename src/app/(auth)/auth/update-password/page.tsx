import { Metadata } from 'next'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Update Password - Cram Support',
  description: 'Update your password',
}

export default function UpdatePasswordPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Update your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </AuthLayout>
  )
} 