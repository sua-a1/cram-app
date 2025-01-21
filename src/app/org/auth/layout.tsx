import React from 'react'
import Link from 'next/link'
import { Building2 } from 'lucide-react'

export default function OrgAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link href="/" className="mb-4 flex items-center space-x-2">
        <Building2 className="h-6 w-6" />
        <span className="text-xl font-bold">CRAM</span>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        {children}
      </div>
    </div>
  )
} 