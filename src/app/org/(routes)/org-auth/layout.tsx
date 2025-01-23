import Link from 'next/link'
import { Building2 } from 'lucide-react'

export default function OrgAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative bg-zinc-900">
        <div className="relative z-20 flex h-full flex-col justify-between p-10">
          <Link
            href="/"
            className="flex items-center text-lg font-medium text-white"
          >
            <Building2 className="mr-2 h-6 w-6" />
            Cram Support
          </Link>
          <div className="relative">
            <blockquote className="space-y-2">
              <p className="text-lg text-white">
                Streamline your organization&apos;s support workflow
              </p>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
} 