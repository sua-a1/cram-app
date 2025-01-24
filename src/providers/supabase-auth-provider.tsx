'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { AuthUser } from '@/types/auth'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AuthContextType = {
  user: AuthUser | null
  supabase: SupabaseClient<Database>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          setUser(session.user as AuthUser)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', { event, session })

          if (event === 'SIGNED_IN') {
            setUser(session?.user as AuthUser)
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, org_id')
              .eq('user_id', session?.user.id)
              .single()

            if (profile) {
              const redirectPath = profile.role === 'customer'
                ? '/customer'
                : profile.org_id
                  ? '/org/dashboard'
                  : '/org/org-auth/access'

              router.push(redirectPath)
              router.refresh()
            }
          }

          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            console.log('Handling sign out event')
            setUser(null)
            // Clear storage
            window.localStorage.clear()
            window.sessionStorage.clear()
            // Force a hard navigation to sign in
            window.location.href = '/org/org-auth/signin'
          }

          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed')
            setUser(session?.user as AuthUser)
          }

          if (event === 'USER_UPDATED') {
            console.log('User updated')
            setUser(session?.user as AuthUser)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        toast({
          title: 'Authentication Error',
          description: 'There was an error initializing authentication. Please try refreshing the page.',
          variant: 'destructive',
        })
      }
    }

    initializeAuth()
  }, [router, supabase, toast])

  const signOut = async () => {
    try {
      console.log('Starting sign out process')
      
      // First clear the session
      const { error } = await supabase.auth.signOut({
        scope: 'global'  // Sign out of all tabs/windows
      })
      if (error) throw error

      console.log('Sign out successful, clearing storage')
      // Clear storage
      window.localStorage.clear()
      window.sessionStorage.clear()
      
      // Reset state
      setUser(null)
      
      // Force a hard navigation to sign in
      console.log('Redirecting to sign in')
      window.location.href = '/org/org-auth/signin'
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error signing out',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const value = {
    user,
    supabase,
    signOut,
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