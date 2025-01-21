'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/server/auth-logic'
import { useToast } from '@/hooks/use-toast'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSignOut() {
    setIsLoading(true)
    try {
      const result = await signOut()
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }
      
      toast({
        title: 'Success',
        description: 'You have been signed out.',
      })

      // Add a small delay to allow the toast to show
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  )
} 