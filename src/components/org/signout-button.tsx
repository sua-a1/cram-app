'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/context/auth-context'

export function SignOutButton() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()

      // Clear profile from localStorage
      localStorage.removeItem('profile')

      // Show success message
      toast({
        title: 'Signed out successfully',
        description: 'Redirecting to sign in...',
      })

      // Hard redirect to sign in
      window.location.href = '/org/org-auth/signin'
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      })
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  )
} 