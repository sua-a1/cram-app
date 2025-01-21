import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email - Cram Support',
  description: 'Verify your email address',
}

export default function VerifyPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent you a verification link. Please check your email to verify your account.
        </p>
      </div>
    </div>
  )
} 