import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { Button } from '@/components/ui/button'
import { Home, Ticket, User } from 'lucide-react'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  if (user.role !== 'customer') {
    if (user.role === 'admin' && user.org_id) {
      redirect(`/${user.org_id}/admin`)
    } else if (user.role === 'employee' && user.org_id) {
      redirect(`/${user.org_id}/employee`)
    } else {
      redirect('/org/access')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold">CRAM</h1>
            </Link>
            <nav className="flex items-center space-x-4 lg:space-x-6">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/tickets">
                  <Ticket className="mr-2 h-4 w-4" />
                  My Tickets
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/user">
                <User className="mr-2 h-4 w-4" />
                Account
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
} 