import { redirect } from 'next/navigation'
import { getSession } from '@/lib/server/auth-logic'

export default async function NewTicketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return <>{children}</>
} 