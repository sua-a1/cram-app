'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/providers/supabase-auth-provider'

export function SignOutButton() {
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Success',
        description: 'Signed out successfully'
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.'
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