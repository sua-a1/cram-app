import * as React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative bg-zinc-900">
        <div className="relative z-20 flex h-full flex-col justify-between p-10">
          <div className="flex items-center text-lg font-medium text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Cram
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg text-white">
              &ldquo;Cram helps me stay organized and focused on what matters most - my studies.&rdquo;
            </p>
            <footer className="text-sm text-white/60">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
} 