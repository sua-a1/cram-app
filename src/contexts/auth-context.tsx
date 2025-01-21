'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'
import { signOut } from '@/app/(auth)/actions'
import { getUser } from '@/lib/client/supabase'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch initial session
  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const user = await getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking auth status:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      setUser(null)
      toast({
        title: 'Signed out successfully',
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      })
    }
  }

  async function refreshUser() {
    await checkUser()
  }

  const value = {
    user,
    isLoading,
    signOut: handleSignOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 