import { Metadata } from 'next'
import { OrgUpdatePasswordForm } from '@/components/org/update-password-form'

export const metadata: Metadata = {
  title: 'Update Password - Cram Support',
  description: 'Update your organization account password',
}

export default function OrgUpdatePasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>
      <OrgUpdatePasswordForm />
    </div>
  )
} 