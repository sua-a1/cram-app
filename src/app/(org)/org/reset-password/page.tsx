import { Metadata } from 'next'
import { OrgResetPasswordForm } from '@/components/org/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password - Cram Support',
  description: 'Reset your organization account password',
}

export default function OrgResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your organization email address and we'll send you a reset link
        </p>
      </div>
      <OrgResetPasswordForm />
    </div>
  )
} 