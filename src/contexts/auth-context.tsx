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
      const response = await fetch('/api/auth/user')
      const data = await response.json()

      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sign out')
      }

      setUser(null)
      router.push('/signin')
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
    signOut,
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