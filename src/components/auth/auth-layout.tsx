import { PropsWithChildren } from 'react'

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="mx-auto w-full max-w-sm space-y-6">
        {children}
      </div>
    </div>
  )
} 