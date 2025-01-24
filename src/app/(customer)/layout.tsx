import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/server/auth-logic'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Home, Ticket, User } from 'lucide-react'
import { NotificationWrapper } from '@/components/notifications/notification-wrapper'

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
    // For organization users, redirect to appropriate route
    if (user.metadata?.org_id) {
      if (user.role === 'admin') {
        redirect(`/${user.metadata.org_id}/admin`)
      } else if (user.role === 'employee') {
        redirect(`/${user.metadata.org_id}/employee`)
      }
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
                <Link href="/customer">
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
            <NotificationWrapper />
            <Button variant="ghost" asChild>
              <Link href="/user">
                <User className="mr-2 h-4 w-4" />
                Account
              </Link>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
} 