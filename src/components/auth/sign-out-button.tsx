'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { signOut } from '@/app/(auth)/actions'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSignOut() {
    setIsLoading(true)
    try {
      await signOut()
      toast({
        title: 'Signed out successfully',
      })
      router.push('/auth/signin')
    } catch (error) {
      if ((error as any)?.digest?.includes('NEXT_REDIRECT')) {
        // This is expected, the server action will handle the redirect
        return
      }
      console.error('Error signing out:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="justify-start"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
} 